'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Settings, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'SUPER_ADMIN';
  createdAt: Date;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  createdAt: Date;
  token: string;
}

const isSuperAdmin = (role: string | undefined): boolean => {
  return role === 'SUPER_ADMIN';
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'SUPER_ADMIN'>(
    'ADMIN'
  );
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Filter states
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'SUPER_ADMIN'>(
    'ALL'
  );
  const [invitationEmailFilter, setInvitationEmailFilter] = useState('');
  const [invitationRoleFilter, setInvitationRoleFilter] = useState<
    'ALL' | 'ADMIN' | 'SUPER_ADMIN'
  >('ALL');

  // Filter functions
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

  // Fetch admin users and pending invitations
  useEffect(() => {
    fetchAdminUsers();
    fetchPendingInvitations();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/admin-users');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que data es un array
        if (Array.isArray(data)) {
          setAdminUsers(data);
        } else {
          console.error('API response is not an array:', data);
          setAdminUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setAdminUsers([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations');
      if (response.ok) {
        const data = await response.json();
        // Asegurar que data.invitations es un array
        if (Array.isArray(data.invitations)) {
          setPendingInvitations(data.invitations);
        } else {
          console.error('API invitations response is not an array:', data);
          setPendingInvitations([]);
        }
      }
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      setPendingInvitations([]); // Asegurar que siempre sea un array
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

        alert(message);
        setNewUserEmail('');
        setNewUserRole('ADMIN');
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar invitación');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error al enviar invitación');
    } finally {
      setInviteLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este administrador?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAdminUsers();
        alert('Administrador eliminado exitosamente');
      } else {
        alert('Error al eliminar administrador');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar administrador');
    }
  };

  const revokeInvitation = async (inviteId: string) => {
    if (!confirm('¿Estás seguro de que quieres revocar esta invitación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invitations/${inviteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPendingInvitations();
        alert('Invitación revocada exitosamente');
      } else {
        alert('Error al revocar invitación');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      alert('Error al revocar invitación');
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
            <form onSubmit={sendInvitation} className="flex gap-4 items-end">
              <div className="flex-1">
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
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')
                  }
                  className="border rounded px-3 py-2"
                >
                  <option value="ADMIN">Admin</option>
                  {isSuperAdmin(session?.user?.role as string) && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                </select>
              </div>
              <Button type="submit" disabled={inviteLoading}>
                <Mail className="mr-2 h-4 w-4" />
                {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-2">
              Se enviará un email con un link de invitación que expira en 24
              horas.
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
              <div className="flex gap-4 mb-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Filtrar por rol
                  </label>
                  <select
                    value={invitationRoleFilter}
                    onChange={(e) =>
                      setInvitationRoleFilter(
                        e.target.value as 'ALL' | 'ADMIN' | 'SUPER_ADMIN'
                      )
                    }
                    className="border rounded px-3 py-2"
                  >
                    <option value="ALL">Todos los roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
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
                                invitation.role === 'SUPER_ADMIN'
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
                              onClick={() => revokeInvitation(invitation.id)}
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
            </div>
          )}

          {/* Current Admin Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Administradores Actuales
            </h3>

            {/* Admin Filters */}
            <div className="flex gap-4 mb-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Filtrar por rol
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value as 'ALL' | 'ADMIN' | 'SUPER_ADMIN'
                    )
                  }
                  className="border rounded px-3 py-2"
                >
                  <option value="ALL">Todos los roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
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
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              user.role === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {user.email !== session?.user?.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
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
            <p>
              • Super Admins actuales: camila@safetap.cl, cpozasg1103@gmail.com
            </p>
            <p>• Solo los Super Admins pueden crear otros Super Admins</p>
            <p>• Los links de invitación expiran en 24 horas</p>
            <p>• Se enviará un email automático con el link de invitación</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
