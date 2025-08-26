import { redirect } from 'next/navigation';

import { prisma } from '@/lib/prisma';

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      stickers: {
        include: {
          profile: {
            include: {
              contacts: {
                orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
              },
            },
          },
        },
      },
    },
  });
}

export default async function EditProfilePage({
  params,
}: EditProfilePageProps) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    return <div>Usuario no encontrado</div>;
  }

  const sticker = user.stickers[0]; // Asumimos que solo hay un sticker por usuario
  if (!sticker) {
    return <div>El usuario no tiene stickers</div>;
  }

  const handleSubmit = async (formData: FormData) => {
    'use server';

    const profile = sticker.profile;
    if (!profile) return;

    const userName = formData.get('userName') as string;
    const bloodType = formData.get('bloodType') as string;
    const organDonor = formData.get('organDonor') === 'on';
    const allergiesString = formData.get('allergies') as string;
    const conditionsString = formData.get('conditions') as string;
    const medicationsString = formData.get('medications') as string;
    const notes = formData.get('notes') as string;

    const allergies = allergiesString
      ? allergiesString
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const conditions = conditionsString
      ? conditionsString
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const medications = medicationsString
      ? medicationsString
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      if (userName && userName !== user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userName,
          },
        });

        await prisma.sticker.updateMany({
          where: { ownerId: user.id },
          data: {
            nameOnSticker: userName,
          },
        });
      }

      await prisma.emergencyProfile.update({
        where: { id: profile.id },
        data: {
          bloodType: bloodType || null,
          organDonor,
          allergies,
          conditions,
          medications,
          notes: notes || null,
        },
      });

      // También actualizar contactos si existen
      const contactNames = formData.getAll('contactName') as string[];
      const contactPhones = formData.getAll('contactPhone') as string[];
      const contactRelations = formData.getAll('contactRelation') as string[];

      // Eliminar contactos existentes y crear nuevos
      await prisma.emergencyContact.deleteMany({
        where: { profileId: profile.id },
      });

      for (let i = 0; i < contactNames.length; i++) {
        if (contactNames[i] && contactPhones[i]) {
          await prisma.emergencyContact.create({
            data: {
              profileId: profile.id,
              name: contactNames[i],
              phone: contactPhones[i],
              relation: contactRelations[i] || 'Contacto de emergencia',
              preferred: i === 0, // El primero es preferido
            },
          });
        }
      }

      redirect(`/dashboard/users/${id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Error al actualizar el perfil');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Editar Perfil de Emergencia
        </h1>
        <p className="text-gray-600 mt-1">Usuario: {user.name || user.email}</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Información del Usuario */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Información Personal</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                name="userName"
                defaultValue={user.name || ''}
                className="w-full border rounded px-3 py-2"
                placeholder="Nombre completo del usuario"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este nombre aparecerá en el perfil de emergencia y stickers
              </p>
            </div>
          </div>
        </div>

        {/* Información médica */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Información Médica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Sangre
              </label>
              <select
                name="bloodType"
                defaultValue={sticker.profile?.bloodType || ''}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar tipo</option>
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

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="organDonor"
                  defaultChecked={sticker.profile?.organDonor || false}
                  className="rounded"
                />
                <span className="text-sm font-medium">Donante de Órganos</span>
              </label>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Alergias (separadas por coma)
              </label>
              <input
                type="text"
                name="allergies"
                defaultValue={sticker.profile?.allergies?.join(', ') || ''}
                className="w-full border rounded px-3 py-2"
                placeholder="Ej. Penicilina, Mariscos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Condiciones Médicas (separadas por coma)
              </label>
              <input
                type="text"
                name="conditions"
                defaultValue={sticker.profile?.conditions?.join(', ') || ''}
                className="w-full border rounded px-3 py-2"
                placeholder="Ej. Diabetes, Hipertensión"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Medicamentos (separados por coma)
              </label>
              <input
                type="text"
                name="medications"
                defaultValue={sticker.profile?.medications?.join(', ') || ''}
                className="w-full border rounded px-3 py-2"
                placeholder="Ej. Metformina, Lisinopril"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Notas Importantes
            </label>
            <textarea
              name="notes"
              defaultValue={sticker.profile?.notes || ''}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Información adicional relevante para emergencias..."
            />
          </div>
        </div>

        {/* Contactos de emergencia */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">
            Contactos de Emergencia
          </h2>

          {sticker.profile?.contacts?.map((contact, _index) => (
            <div
              key={contact.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  name="contactName"
                  defaultValue={contact.name}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  defaultValue={contact.phone}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Relación
                </label>
                <select
                  name="contactRelation"
                  defaultValue={contact.relation}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Padre/Madre">Padre/Madre</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Esposo/a">Esposo/a</option>
                  <option value="Pareja">Pareja</option>
                  <option value="Amigo/a">Amigo/a</option>
                  <option value="Médico">Médico</option>
                  <option value="Contacto de emergencia">
                    Contacto de emergencia
                  </option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
          >
            Guardar Cambios
          </button>
          <a
            href={`/dashboard/users/${id}`}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded font-medium"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
