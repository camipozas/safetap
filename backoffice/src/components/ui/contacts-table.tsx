'use client';

import { formatDateTime } from '@/lib/utils';
import { Edit2, Phone, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import ConfirmationModal from './confirmation-modal';
import ContactEditModal from './contact-edit-modal';

type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  country: string | null;
  preferred: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface ContactsTableProps {
  contacts: Contact[];
  profileId?: string;
  userId: string;
}

export default function ContactsTable({
  contacts,
  profileId,
  userId,
}: ContactsTableProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const handleNewContact = () => {
    setSelectedContact(null);
    setIsEditModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedContact(null);
    setContactToDelete(null);
  };

  const handleSaveContact = async (contactData: Record<string, unknown>) => {
    try {
      const url = selectedContact
        ? `/api/admin/contacts/${selectedContact.id}`
        : '/api/admin/contacts';

      const method = selectedContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactData,
          profileId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error at saving contact');
      }

      handleCloseModals();
      window.location.reload();
    } catch (error) {
      alert('Error al guardar el contacto');
    }
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    setLoadingStates((prev) => ({ ...prev, [contactToDelete.id]: true }));

    try {
      const response = await fetch(
        `/api/admin/contacts/${contactToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar contacto');
      }

      handleCloseModals();
      window.location.reload();
    } catch (error) {
      alert('Error al eliminar el contacto');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [contactToDelete.id]: false }));
    }
  };

  const togglePreferred = async (contact: Contact) => {
    setLoadingStates((prev) => ({ ...prev, [contact.id]: true }));

    try {
      const response = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contact,
          preferred: !contact.preferred,
        }),
      });

      if (!response.ok) {
        throw new Error('Error at updating contact');
      }

      window.location.reload();
    } catch (error) {
      alert('Error al actualizar el contacto');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [contact.id]: false }));
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Button to add new contact */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Contactos ({contacts.length})</h3>
          <Button onClick={handleNewContact} className="text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Contacto
          </Button>
        </div>

        {/* List of contacts */}
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {contact.name}
                      </h4>
                      {contact.preferred && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Preferido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{contact.relation}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{contact.phone}</span>
                      {contact.country && (
                        <>
                          <span>•</span>
                          <span>{contact.country}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Creado: {formatDateTime(contact.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={contact.preferred ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePreferred(contact)}
                    disabled={loadingStates[contact.id]}
                    className="text-xs"
                  >
                    {contact.preferred
                      ? 'Quitar preferido'
                      : 'Marcar preferido'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditContact(contact)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteContact(contact)}
                    disabled={loadingStates[contact.id]}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay contactos de emergencia configurados</p>
              <p className="text-sm">
                Agrega el primer contacto haciendo clic en &quot;Agregar
                Contacto&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edition Modal */}
      <ContactEditModal
        contact={selectedContact}
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveContact}
      />

      {/* Modal to confirm deletion */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        onConfirm={confirmDeleteContact}
        title="Eliminar Contacto"
        message={`¿Estás seguro de que quieres eliminar el contacto "${contactToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </>
  );
}
