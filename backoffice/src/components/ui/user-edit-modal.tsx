'use client';

import { USER_ROLES } from '@/types/shared';
import { Edit2, Save, Shield, User, X } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from './confirmation-modal';

interface UserEditModalProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    country: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, data: unknown) => Promise<void>;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    role: user.role,
    country: user.country || '',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const hasChanges =
    formData.name !== (user.name || '') ||
    formData.role !== user.role ||
    formData.country !== (user.country || '');

  const handleSave = () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    setLoading(true);
    try {
      await onSave(user.id, formData);
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      alert('Error guardando el usuario');
    } finally {
      setLoading(false);
    }
  };

  const getConfirmationMessage = () => {
    const changes = [];
    if (formData.name !== (user.name || '')) {
      changes.push(
        `Nombre: "${user.name || 'Sin nombre'}" → "${formData.name}"`
      );
    }
    if (formData.role !== user.role) {
      changes.push(`Rol: "${user.role}" → "${formData.role}"`);
    }
    if (formData.country !== (user.country || '')) {
      changes.push(
        `País: "${user.country || 'Sin país'}" → "${formData.country}"`
      );
    }

    return `¿Estás seguro de que quieres realizar los siguientes cambios para ${user.email}?\n\n${changes.join('\n')}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-safetap-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Usuario
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Email (non editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (no editable)
              </label>
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-safetap-500 focus:border-safetap-500"
                placeholder="Nombre del usuario"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Rol</span>
                </div>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-safetap-500 focus:border-safetap-500"
              >
                <option value={USER_ROLES.USER}>Usuario</option>
                <option value={USER_ROLES.ADMIN}>Administrador</option>
              </select>
              {formData.role === USER_ROLES.ADMIN &&
                formData.role !== user.role && (
                  <p className="mt-1 text-xs text-orange-600">
                    ⚠️ Le otorgarás permisos de administrador a este usuario
                  </p>
                )}
              {formData.role === USER_ROLES.USER &&
                user.role === USER_ROLES.ADMIN && (
                  <p className="mt-1 text-xs text-red-600">
                    ⚠️ Le quitarás permisos de administrador a este usuario
                  </p>
                )}
            </div>

            {/* Country */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                País
              </label>
              <input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-safetap-500 focus:border-safetap-500"
                placeholder="Código de país (ej: CL, ES, US)"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-safetap-600 hover:bg-safetap-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-safetap-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmSave}
        title="Confirmar Cambios"
        message={getConfirmationMessage()}
        confirmText="Sí, guardar cambios"
        cancelText="No, cancelar"
        type={formData.role !== user.role ? 'warning' : 'info'}
      />
    </>
  );
}
