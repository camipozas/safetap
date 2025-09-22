'use client';

import { canManageAdmins, isSuperAdmin, USER_ROLES } from '@/types/shared';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export default function AdminManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'SUPER_ADMIN'>(
    'ADMIN'
  );

  const canManage =
    session?.user?.role && canManageAdmins(session.user.role as string);

  useEffect(() => {
    if (canManage) {
      fetchAdminUsers();
    }
  }, [canManage]);

  /**
   * Fetch admin users
   */
  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/admin-users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add admin user
   * @param e - The form event
   */
  const addAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    try {
      const response = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          role: newUserRole,
        }),
      });

      if (response.ok) {
        setNewUserEmail('');
        setNewUserRole('ADMIN');
        fetchAdminUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding admin user');
      }
    } catch (error) {
      console.error('Error adding admin user:', error);
      alert('Error adding admin user');
    }
  };

  /**
   * Update user role
   * @param userId - The user id
   * @param newRole - The new role
   */
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchAdminUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  /**
   * Remove admin access
   * @param userId - The user id
   */
  const removeAdminAccess = async (userId: string) => {
    if (
      !confirm('¿Estás seguro de remover el acceso de admin a este usuario?')
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admin-users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAdminUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Error removing admin access');
      }
    } catch (error) {
      console.error('Error removing admin access:', error);
      alert('Error removing admin access');
    }
  };

  if (!canManage) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p>Solo los SUPER_ADMIN pueden gestionar usuarios administradores.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Administradores</h1>

      {/* Add New Admin Form */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Agregar Nuevo Administrador
        </h2>
        <form onSubmit={addAdminUser} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="admin@ejemplo.com"
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
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Usuario</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Rol</th>
              <th className="text-left p-4 font-medium">Fecha de Creación</th>
              <th className="text-left p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <div className="font-medium">
                      {user.name || 'Sin nombre'}
                    </div>
                  </div>
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                    disabled={user.id === session?.user?.id}
                  >
                    <option value={USER_ROLES.USER}>Usuario</option>
                    <option value={USER_ROLES.ADMIN}>Admin</option>
                    {isSuperAdmin(session?.user?.role as string) && (
                      <option value={USER_ROLES.SUPER_ADMIN}>
                        Super Admin
                      </option>
                    )}
                  </select>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {user.id !== session?.user?.id && (
                    <button
                      onClick={() => removeAdminAccess(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover Acceso
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
