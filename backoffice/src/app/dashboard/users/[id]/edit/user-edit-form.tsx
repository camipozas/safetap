'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface UserEditFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    country: string | null;
    Sticker: Array<{
      id: string;
      nameOnSticker: string;
      flagCode: string;
      EmergencyProfile: {
        id: string;
        bloodType: string | null;
        allergies: string[];
        conditions: string[];
        medications: string[];
        notes: string | null;
        EmergencyContact: Array<{
          id: string;
          name: string;
          phone: string;
          relation: string;
          preferred: boolean;
        }>;
      } | null;
    }>;
  };
}

export default function UserEditForm({ user }: UserEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    country: user.country || '',
    bloodType: user.Sticker[0]?.EmergencyProfile?.bloodType || '',
    allergies: user.Sticker[0]?.EmergencyProfile?.allergies?.join(', ') || '',
    conditions: user.Sticker[0]?.EmergencyProfile?.conditions?.join(', ') || '',
    medications:
      user.Sticker[0]?.EmergencyProfile?.medications?.join(', ') || '',
    notes: user.Sticker[0]?.EmergencyProfile?.notes || '',
    contacts: user.Sticker[0]?.EmergencyProfile?.EmergencyContact || [
      { id: '', name: '', phone: '', relation: '', preferred: true },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          country: formData.country,
          profile: {
            bloodType: formData.bloodType,
            allergies: formData.allergies
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            conditions: formData.conditions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            medications: formData.medications
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            notes: formData.notes,
            contacts: formData.contacts,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el usuario');
      }

      alert('Usuario actualizado exitosamente');
      window.history.back();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [
        ...formData.contacts,
        { id: '', name: '', phone: '', relation: '', preferred: false },
      ],
    });
  };

  const removeContact = (index: number) => {
    const newContacts = formData.contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, contacts: newContacts });
  };

  const updateContact = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, contacts: newContacts });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Información Médica */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold mb-4">Información Médica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Sangre
              </label>
              <select
                value={formData.bloodType}
                onChange={(e) =>
                  setFormData({ ...formData, bloodType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tipo de sangre</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alergias (separadas por comas)
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
                placeholder="Ej: Polen, Mariscos, Penicilina"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condiciones Médicas (separadas por comas)
              </label>
              <input
                type="text"
                value={formData.conditions}
                onChange={(e) =>
                  setFormData({ ...formData, conditions: e.target.value })
                }
                placeholder="Ej: Diabetes, Hipertensión"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicamentos (separados por comas)
              </label>
              <input
                type="text"
                value={formData.medications}
                onChange={(e) =>
                  setFormData({ ...formData, medications: e.target.value })
                }
                placeholder="Ej: Insulina, Aspirina"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contactos de Emergencia */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Contactos de Emergencia</h2>
            <Button type="button" onClick={addContact} variant="outline">
              Agregar Contacto
            </Button>
          </div>
          <div className="space-y-4">
            {formData.contacts.map((contact, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) =>
                        updateContact(index, 'name', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) =>
                        updateContact(index, 'phone', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relación
                    </label>
                    <input
                      type="text"
                      value={contact.relation}
                      onChange={(e) =>
                        updateContact(index, 'relation', e.target.value)
                      }
                      placeholder="Ej: Padre, Madre, Esposo/a"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={contact.preferred}
                        onChange={(e) =>
                          updateContact(index, 'preferred', e.target.checked)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Preferido</span>
                    </label>
                    {formData.contacts.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeContact(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
