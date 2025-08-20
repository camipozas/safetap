import { AlertTriangle, Heart, Phone, Shield, User } from 'lucide-react';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';

interface QrProfilePageProps {
  params: Promise<{ profileId: string }>;
}

export default async function QrProfilePage({ params }: QrProfilePageProps) {
  const { profileId } = await params;

  // Find the profile by ID and check if it's public and has active payment
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      id: profileId,
      consentPublic: true,
      sticker: {
        status: 'ACTIVE', // Only show profiles with active stickers
        payments: {
          some: {
            status: {
              in: ['TRANSFER_PAYMENT', 'VERIFIED', 'PAID', 'TRANSFERRED'], // Accept paid and transferred statuses
            },
          },
        },
      },
    },
    include: {
      contacts: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      sticker: {
        select: {
          slug: true,
          serial: true,
          status: true,
        },
      },
    },
  });

  if (!profile || !profile.sticker) {
    notFound();
  }

  // Log the access
  await prisma.profileAccessLog.create({
    data: {
      profileId: profile.id,
      via: 'QR',
    },
  });

  const userName =
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';

  return (
    <article className="max-w-2xl mx-auto bg-white">
      {/* Header with emergency indicator */}
      <header className="bg-red-50 border-b-2 border-red-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-800">
              Información de Emergencia
            </h1>
            <p className="text-red-600 text-sm">
              Perfil médico de emergencia - SafeTap
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">{userName}</h2>
            {profile.language && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                {profile.language.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Código: {profile.sticker.serial}
          </p>
        </div>
      </header>

      {/* Medical Information Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Información Médica
          </h3>
        </div>

        <div className="space-y-3">
          {profile.bloodType && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800">
                <strong>Tipo de Sangre:</strong> {profile.bloodType}
              </p>
            </div>
          )}

          {profile.allergies.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="font-medium text-orange-800">
                <strong>Alergias:</strong> {profile.allergies.join(', ')}
              </p>
            </div>
          )}

          {profile.conditions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-800">
                <strong>Condiciones Médicas:</strong>{' '}
                {profile.conditions.join(', ')}
              </p>
            </div>
          )}

          {profile.medications.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-800">
                <strong>Medicamentos:</strong> {profile.medications.join(', ')}
              </p>
            </div>
          )}

          {profile.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-800">
                <strong>Notas Importantes:</strong> {profile.notes}
              </p>
            </div>
          )}

          {profile.organDonor && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800">
                <strong>Donante de Órganos:</strong> Sí
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Emergency Contacts Section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Contactos de Emergencia
          </h3>
        </div>

        {profile.contacts.length > 0 ? (
          <div className="space-y-3">
            {profile.contacts.map((contact) => (
              <div
                key={contact.id}
                className={`rounded-lg border p-4 ${
                  contact.preferred
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {contact.name}
                      </p>
                      {contact.preferred && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Preferido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {contact.relation}
                    </p>
                    {contact.country && (
                      <p className="text-xs text-gray-500">{contact.country}</p>
                    )}
                  </div>

                  <a
                    href={`tel:${contact.phone}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    aria-label={`Llamar a ${contact.name}`}
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>
                </div>
                <p className="text-sm font-mono text-gray-700 mt-2">
                  {contact.phone}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 text-center">
              No hay contactos de emergencia configurados
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t pt-6 mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-medium text-gray-700">SafeTap</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Información importante:</strong>
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Esta información es proporcionada por el usuario</li>
            <li>• No sustituye atención médica profesional</li>
            <li>
              • En caso de emergencia, contacte inmediatamente al 131
              (Ambulancia)
            </li>
            <li>• Acceso registrado para seguridad del usuario</li>
          </ul>
        </div>
      </footer>
    </article>
  );
}

export async function generateMetadata({ params }: QrProfilePageProps) {
  const { profileId } = await params;

  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      id: profileId,
      consentPublic: true,
      sticker: {
        status: 'ACTIVE',
        payments: {
          some: {
            status: {
              in: ['TRANSFER_PAYMENT', 'VERIFIED'],
            },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      title: 'Perfil no encontrado - SafeTap',
      description: 'El perfil de emergencia solicitado no fue encontrado.',
    };
  }

  const userName =
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';

  return {
    title: `Perfil de Emergencia - ${userName} | SafeTap`,
    description: `Información de emergencia de ${userName} - SafeTap`,
    robots: 'noindex, nofollow', // Privacy protection
  };
}
