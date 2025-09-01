'use client';

import { formatCLPAmount, formatDateTime } from '@/lib/utils';
import { Role } from '@/types/shared';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './button';
import UserEditModal from './user-edit-modal';

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  country: string | null;
  role: Role;
  createdAt: Date;
  _count: {
    Sticker: number;
    Payment: number;
  };
  EmergencyProfile: {
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
  }[];
  totalSpent: number;
};

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  const handleEditUser = (user: User) => {
    // Navigate to user details page instead of opening modal
    router.push(`/dashboard/users/${user.id}`);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (userId: string, data: unknown) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar usuario');
      }

      handleCloseModal();
      window.location.reload();
    } catch (error) {
      alert('Error al actualizar el usuario');
    }
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Usuario</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">País</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Grupo Sanguíneo</th>
              <th className="text-left p-3">Stickers</th>
              <th className="text-left p-3">Pagos</th>
              <th className="text-left p-3">Total Gastado</th>
              <th className="text-left p-3">Registro</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'Usuario'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {user.name || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {user.id.slice(-8)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm">{user.email}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm">{user.country || '-'}</div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  <div className="text-sm">
                    {user.EmergencyProfile?.[0]?.bloodType ? (
                      <span className="font-medium text-red-600">
                        {user.EmergencyProfile[0].bloodType}
                      </span>
                    ) : (
                      <span className="text-gray-400">No especificado</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-center">
                    <span className="font-medium">{user._count.Sticker}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-center">
                    <span className="font-medium">{user._count.Payment}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium">
                    {user.totalSpent > 0
                      ? formatCLPAmount(user.totalSpent)
                      : '-'}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-xs">
                    {formatDateTime(user.createdAt)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      className="text-xs"
                      title="Ver detalles completos del usuario"
                    >
                      Ver Perfil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/users/${user.id}/contacts`)
                      }
                      className="text-xs"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Contactos
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border rounded-lg p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start space-x-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'Usuario'}
                  className="w-12 h-12 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {user.name || 'Sin nombre'}
                    </div>
                    <div className="text-xs text-gray-500 break-all">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {user.id.slice(-8)}
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      user.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">País:</span>
                <div className="font-medium">
                  {user.country || 'No especificado'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Grupo Sanguíneo:</span>
                <div>
                  {user.EmergencyProfile?.[0]?.bloodType ? (
                    <span className="font-medium text-red-600">
                      {user.EmergencyProfile[0].bloodType}
                    </span>
                  ) : (
                    <span className="text-gray-400">No especificado</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Stickers:</span>
                <div className="font-medium">{user._count.Sticker}</div>
              </div>
              <div>
                <span className="text-gray-500">Pagos:</span>
                <div className="font-medium">{user._count.Payment}</div>
              </div>
              <div>
                <span className="text-gray-500">Total Gastado:</span>
                <div className="font-medium">
                  {user.totalSpent > 0
                    ? formatCLPAmount(user.totalSpent)
                    : 'Sin gastos'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Registro:</span>
                <div className="font-medium">
                  {formatDateTime(user.createdAt)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditUser(user)}
                className="text-xs flex-1"
                title="Ver detalles completos del usuario"
              >
                Ver Perfil Completo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/users/${user.id}/contacts`)
                }
                className="text-xs flex-1"
              >
                <Users className="w-3 h-3 mr-1" />
                Ver Contactos
              </Button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay usuarios registrados
        </div>
      )}

      {/* Modal edition */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </>
  );
}
