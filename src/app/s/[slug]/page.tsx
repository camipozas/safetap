import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';

export default async function PublicProfile(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const profile = await prisma.emergencyProfile.findFirst({
    where: { sticker: { slug: params.slug }, consentPublic: true },
    include: {
      contacts: { orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }] },
      user: true,
    },
  });

  if (!profile) {
    notFound();
  }

  await prisma.profileAccessLog.create({
    data: { profileId: profile.id, via: 'DIRECT' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header with emergency indicator */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              🚨 INFORMACIÓN DE EMERGENCIA
            </h1>
            <div className="text-lg text-slate-700 mb-4">
              {profile.user.name ?? profile.user.email?.split('@')[0]}
              <span className="ml-2 text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded">
                {profile.language ?? 'es'}
              </span>
            </div>
            <p className="text-sm text-slate-600">SafeTap ID: {params.slug}</p>
          </div>

          {/* Medical Information */}
          <div className="space-y-6">
            {profile.bloodType && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Tipo de sangre</p>
                  <p className="text-red-800 text-lg font-bold">
                    {profile.bloodType}
                  </p>
                </div>
              </div>
            )}

            {profile.allergies.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-yellow-900">⚠️ Alergias</p>
                  <p className="text-yellow-800">
                    {profile.allergies.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {profile.conditions.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-blue-900">
                    🏥 Condiciones médicas
                  </p>
                  <p className="text-blue-800">
                    {profile.conditions.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {profile.medications.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-900">
                    💊 Medicamentos
                  </p>
                  <p className="text-green-800">
                    {profile.medications.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {profile.notes && (
              <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-purple-900">
                    📝 Información importante
                  </p>
                  <p className="text-purple-800">{profile.notes}</p>
                </div>
              </div>
            )}

            {/* Emergency Contacts */}
            {profile.contacts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  📞 Contactos de emergencia
                </h2>
                <div className="space-y-3">
                  {profile.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 rounded-lg border-2 ${
                        contact.preferred
                          ? 'bg-green-50 border-green-300 shadow-md'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg text-slate-900">
                              {contact.name}
                            </p>
                            {contact.preferred && (
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                                PREFERIDO
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium">
                            {contact.relation}
                          </p>
                          {contact.country && (
                            <p className="text-sm text-slate-600">
                              {contact.country}
                            </p>
                          )}
                        </div>
                        <a
                          className={`px-6 py-3 rounded-lg font-bold text-white text-lg transition-colors ${
                            contact.preferred
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          href={`tel:${contact.phone}`}
                          aria-label={`Llamar a ${contact.name}`}
                        >
                          📞 {contact.phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Esta información es proporcionada por el usuario y no sustituye la
              atención médica profesional.
            </p>
            <p className="text-xs text-slate-400">
              SafeTap - Sistema de identificación de emergencias
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
