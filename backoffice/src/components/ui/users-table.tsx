'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Role } from '@/types/shared';
import { Users } from 'lucide-react';
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
    stickers: number;
    payments: number;
  };
  profiles: {
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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
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
      <div className="overflow-x-auto">
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
                    {user.profiles[0]?.bloodType ? (
                      <span className="font-medium text-red-600">
                        {user.profiles[0].bloodType}
                      </span>
                    ) : (
                      <span className="text-gray-400">No especificado</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-center">
                    <span className="font-medium">{user._count.stickers}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-center">
                    <span className="font-medium">{user._count.payments}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium">
                    {user.totalSpent > 0
                      ? formatCurrency(user.totalSpent)
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
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/dashboard/users/${user.id}/contacts`,
                          '_blank'
                        )
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
