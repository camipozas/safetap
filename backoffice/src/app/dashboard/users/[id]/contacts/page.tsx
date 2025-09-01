import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContactsTable from '@/components/ui/contacts-table';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

async function getUserWithContacts(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      EmergencyProfile: {
        include: {
          EmergencyContact: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });
}

export default async function UserContactsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const user = await getUserWithContacts(params.id);

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Usuario no encontrado
          </h1>
        </div>
      </div>
    );
  }

  const profile = user.EmergencyProfile?.[0];
  const contacts = profile?.EmergencyContact || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Contactos
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona la información de contacto de emergencia para{' '}
          {user.name || user.email}
        </p>
      </div>

      {/* User information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Nombre
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {user.name || 'Sin nombre'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 text-sm text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">País</label>
              <div className="mt-1 text-sm text-gray-900">
                {user.country || 'No especificado'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Rol</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Registro
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {formatDateTime(user.createdAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contactos de Emergencia</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactsTable
            contacts={contacts}
            profileId={profile?.id}
            userId={user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
