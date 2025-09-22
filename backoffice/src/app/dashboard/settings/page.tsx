'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { USER_ROLES, UserRole } from '@/types/shared';
import { Mail, Settings, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type AdminRole = Exclude<UserRole, 'USER'>;
type FilterRole = AdminRole | 'ALL';
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  createdAt: Date;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: Date;
  token: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminRole>('ADMIN');
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('ALL');
  const [invitationEmailFilter, setInvitationEmailFilter] = useState('');
  const [invitationRoleFilter, setInvitationRoleFilter] =
    useState<FilterRole>('ALL');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({ show: false, message: '', type: 'success' });

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const filteredAdminUsers = adminUsers.filter((user) => {
    const emailMatch =
      user.email.toLowerCase().includes(emailFilter.toLowerCase()) ||
      (user.name &&
        user.name.toLowerCase().includes(emailFilter.toLowerCase()));
    const roleMatch = roleFilter === 'ALL' || user.role === roleFilter;
    return emailMatch && roleMatch;
  });

  const filteredPendingInvitations = pendingInvitations.filter((invitation) => {
    const emailMatch = invitation.email
      .toLowerCase()
      .includes(invitationEmailFilter.toLowerCase());
    const roleMatch =
      invitationRoleFilter === 'ALL' ||
      invitation.role === invitationRoleFilter;
    return emailMatch && roleMatch;
  });

  useEffect(() => {
    fetchAdminUsers();
    fetchPendingInvitations();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/admin-users');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAdminUsers(data);
        } else {
          setAdminUsers([]);
        }
      }
    } catch (error) {
      setAdminUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.invitations)) {
          setPendingInvitations(data.invitations);
        } else {
          setPendingInvitations([]);
        }
      }
    } catch (error) {
      setPendingInvitations([]);
    }
  };

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        let message = `Invitación creada para ${newUserEmail}.`;

        if (data.emailSent) {
          message += ' Email de invitación enviado exitosamente.';
        } else if (data.warning) {
          message += `\n\n⚠️ ${data.warning}`;
          if (data.inviteUrl) {
            message += `\n\nLink de invitación manual: ${data.inviteUrl}`;
          }
        } else if (data.inviteUrl) {
          message += ` Link de invitación: ${data.inviteUrl}`;
        }

        showNotification(message, 'success');
        setNewUserEmail('');
        setNewUserRole('ADMIN');
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Error al enviar invitación', 'error');
      }
    } catch (error) {
      showNotification('Error al enviar invitación', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/admin-users/${userToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAdminUsers();
        showNotification(
          'Permisos de administrador removidos exitosamente (usuario convertido a USER)',
          'success'
        );
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        showNotification(
          errorData.error || 'Error al eliminar administrador',
          'error'
        );
      }
    } catch (error) {
      showNotification('Error al eliminar administrador', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRevokeInvitation = (inviteId: string) => {
    setInviteToRevoke(inviteId);
    setShowRevokeModal(true);
  };

  const revokeInvitation = async () => {
    if (!inviteToRevoke) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/invitations/${inviteToRevoke}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPendingInvitations();
        showNotification('Invitación revocada exitosamente', 'success');
        setShowRevokeModal(false);
        setInviteToRevoke(null);
      } else {
        showNotification('Error al revocar invitación', 'error');
      }
    } catch (error) {
      showNotification('Error al revocar invitación', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AdminRole) => {
    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (response.ok) {
        fetchAdminUsers();
        showNotification(
          `Rol actualizado a ${newRole} exitosamente`,
          'success'
        );
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Error al actualizar rol', 'error');
        fetchAdminUsers();
      }
    } catch (error) {
      showNotification('Error al actualizar rol', 'error');
      fetchAdminUsers();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Configuración del Sistema
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración general y los administradores del sistema
        </p>
      </div>

      {/* Admin Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Gestión de Administradores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Admin Form */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Invitar Nuevo Administrador
            </h3>
            <form
              onSubmit={sendInvitation}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="nuevo.admin@ejemplo.com"
                  required
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
                  className="w-full sm:w-auto border rounded px-3 py-2"
                >
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                  <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={inviteLoading}
                className="w-full sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-2">
              Se enviará un email con un link de invitación que expira en 24
              horas.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Nota: En desarrollo, ambas opciones están disponibles. En
              producción, solo Super Admins pueden crear otros Super Admins.
            </p>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Invitaciones Pendientes
              </h3>
              {/* Invitation Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Filtrar por email
                  </label>
                  <input
                    type="text"
                    value={invitationEmailFilter}
                    onChange={(e) => setInvitationEmailFilter(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Buscar por email..."
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium mb-1">
                    Filtrar por rol
                  </label>
                  <select
                    value={invitationRoleFilter}
                    onChange={(e) =>
                      setInvitationRoleFilter(e.target.value as FilterRole)
                    }
                    className="w-full sm:w-auto border rounded px-3 py-2"
                  >
                    <option value="ALL">Todos los roles</option>
                    <option value={USER_ROLES.ADMIN}>Admin</option>
                    <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
              </div>{' '}
              <div className="border rounded-lg overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Rol</th>
                        <th className="text-left p-3">Enviada</th>
                        <th className="text-left p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(filteredPendingInvitations) &&
                        filteredPendingInvitations.map((invitation) => (
                          <tr key={invitation.id} className="border-t">
                            <td className="p-3">{invitation.email}</td>
                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  invitation.role === USER_ROLES.SUPER_ADMIN
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {invitation.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {new Date(
                                invitation.createdAt
                              ).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRevokeInvitation(invitation.id)
                                }
                                className="text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Revocar
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3 p-3">
                  {Array.isArray(filteredPendingInvitations) &&
                    filteredPendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="bg-gray-50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm break-all">
                              {invitation.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              Enviada:{' '}
                              {new Date(
                                invitation.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${
                              invitation.role === USER_ROLES.SUPER_ADMIN
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {invitation.role}
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRevokeInvitation(invitation.id)
                            }
                            className="text-xs w-full"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Revocar Invitación
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Admin Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Administradores Actuales
            </h3>

            {/* Admin Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Filtrar por email o nombre
                </label>
                <input
                  type="text"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Buscar por email o nombre..."
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium mb-1">
                  Filtrar por rol
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
                  className="w-full sm:w-auto border rounded px-3 py-2"
                >
                  <option value="ALL">Todos los roles</option>
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                  <option value={USER_ROLES.SUPER_ADMIN}>Super Admin</option>
                </select>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Usuario</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Rol</th>
                      <th className="text-left p-3">Registro</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredAdminUsers) &&
                      filteredAdminUsers.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">
                              {user.name || 'Sin nombre'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {user.id}
                            </div>
                          </td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">
                            <select
                              value={user.role as string}
                              onChange={(e) =>
                                updateUserRole(
                                  user.id,
                                  e.target.value as AdminRole
                                )
                              }
                              className="text-xs border rounded px-2 py-1 bg-white"
                            >
                              <option value={USER_ROLES.ADMIN}>ADMIN</option>
                              <option value={USER_ROLES.SUPER_ADMIN}>
                                SUPER_ADMIN
                              </option>
                            </select>
                          </td>
                          <td className="p-3">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {user.email !== session?.user?.email && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remover Admin
                              </Button>
                            )}
                            {user.email === session?.user?.email && (
                              <span className="text-xs text-gray-500">
                                (Tú mismo)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-3">
                {Array.isArray(filteredAdminUsers) &&
                  filteredAdminUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-50 rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {user.name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500 break-all">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {user.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            Registro:{' '}
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Rol:
                          </label>
                          <select
                            value={user.role as string}
                            onChange={(e) =>
                              updateUserRole(
                                user.id,
                                e.target.value as AdminRole
                              )
                            }
                            className="text-xs border rounded px-2 py-1 bg-white w-full"
                          >
                            <option value={USER_ROLES.ADMIN}>ADMIN</option>
                            <option value={USER_ROLES.SUPER_ADMIN}>
                              SUPER_ADMIN
                            </option>
                          </select>
                        </div>

                        {user.email !== session?.user?.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs text-red-600 hover:text-red-800 w-full"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover Administrador
                          </Button>
                        )}
                        {user.email === session?.user?.email && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            (Este eres tú)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>• Solo los Super Admins pueden crear otros Super Admins</p>
            <p>• Los links de invitación expiran en 24 horas</p>
            <p>• Se enviará un email automático con el link de invitación</p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={deleteUser}
        title="Remover Permisos de Administrador"
        message="¿Estás seguro de que quieres remover los permisos de administrador de este usuario? El usuario será convertido a USER normal y perderá acceso al panel de administración."
        confirmText="Remover Permisos"
        cancelText="Cancelar"
        type="danger"
        isLoading={deleteLoading}
      />

      <ConfirmationModal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setInviteToRevoke(null);
        }}
        onConfirm={revokeInvitation}
        title="Revocar Invitación"
        message="¿Estás seguro de que quieres revocar esta invitación? El usuario no podrá usar el link de invitación."
        confirmText="Revocar"
        cancelText="Cancelar"
        type="warning"
        isLoading={deleteLoading}
      />

      {/* Notification Toast */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === 'success'
              ? 'bg-green-100 border-green-500 text-green-800'
              : notification.type === 'error'
                ? 'bg-red-100 border-red-500 text-red-800'
                : 'bg-yellow-100 border-yellow-500 text-yellow-800'
          } border-l-4`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() =>
                setNotification({ show: false, message: '', type: 'success' })
              }
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
