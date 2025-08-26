import { notFound, redirect } from 'next/navigation';

import StickerPreview from '@/components/StickerPreview';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  country: string | null;
  preferred: boolean;
};

export default async function PreviewPage(props: {
  params: Promise<{ stickerId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const params = await props.params;
  const sticker = await prisma.sticker.findFirst({
    where: {
      id: params.stickerId,
      User: { email: session.user.email },
    },
    include: {
      EmergencyProfile: {
        include: {
          EmergencyContact: {
            orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
          },
        },
      },
      User: true,
    },
  });

  if (!sticker) {
    notFound();
  }

  const profile = sticker.EmergencyProfile;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Vista previa de tu SafeTap
        </h1>
        <p className="text-slate-600">
          Así es como se verá tu sticker y la información que aparecerá cuando
          alguien escanee el QR
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sticker Preview */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Tu sticker físico</h2>
          <div className="flex justify-center">
            <StickerPreview
              name={sticker.nameOnSticker}
              flagCode={sticker.flagCode}
              stickerColor={sticker.stickerColor || '#f1f5f9'}
              textColor={sticker.textColor || '#000000'}
              showRealQR={
                sticker.status === 'SHIPPED' || sticker.status === 'ACTIVE'
              }
              stickerId={sticker.id}
              serial={sticker.serial}
              className="w-64 h-64"
            />
          </div>
          {/* Solo mostrar información técnica en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-center text-sm text-slate-600">
              <p>
                Serial: <span className="font-mono">{sticker.serial}</span>
              </p>
              <p>
                URL pública:{' '}
                <span className="font-mono">/s/{sticker.slug}</span>
              </p>
              <p>
                Colores:{' '}
                <span className="font-mono">
                  {sticker.stickerColor} / {sticker.textColor}
                </span>
              </p>
            </div>
          )}
          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              Estado:{' '}
              <span
                className={`font-medium px-2 py-1 rounded text-xs ${
                  sticker.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : sticker.status === 'SHIPPED'
                      ? 'bg-blue-100 text-blue-800'
                      : sticker.status === 'PRINTING'
                        ? 'bg-orange-100 text-orange-800'
                        : sticker.status === 'PAID'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {sticker.status === 'ORDERED' && '📝 Creada'}
                {sticker.status === 'PAID' && '💰 Pagada'}
                {sticker.status === 'PRINTING' && '🖨️ Imprimiendo'}
                {sticker.status === 'SHIPPED' && '📦 Enviada'}
                {sticker.status === 'ACTIVE' && '✅ Activa'}
                {sticker.status === 'LOST' && '❌ Perdida'}
              </span>
            </p>
          </div>
        </div>

        {/* Profile Information Preview */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">
            Información de emergencia
          </h2>

          {profile ? (
            <article className="space-y-6">
              <header>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {sticker.User.name ?? sticker.User.email?.split('@')[0]}{' '}
                  <span className="text-sm rounded bg-slate-200 px-2 py-1">
                    {profile.language ?? 'es'}
                  </span>
                </h3>
                <p className="text-slate-600">SafeTap ID: {sticker.slug}</p>
              </header>

              <div className="space-y-3">
                {profile.bloodType && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <p>
                      <strong>Tipo de sangre:</strong> {profile.bloodType}
                    </p>
                  </div>
                )}
                {profile.allergies.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                    <p>
                      <strong>Alergias:</strong> {profile.allergies.join(', ')}
                    </p>
                  </div>
                )}
                {profile.conditions.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <p>
                      <strong>Condiciones médicas:</strong>{' '}
                      {profile.conditions.join(', ')}
                    </p>
                  </div>
                )}
                {profile.medications.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <p>
                      <strong>Medicamentos:</strong>{' '}
                      {profile.medications.join(', ')}
                    </p>
                  </div>
                )}
                {profile.notes && (
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                    <p>
                      <strong>Notas importantes:</strong> {profile.notes}
                    </p>
                  </div>
                )}
              </div>

              {profile.EmergencyContact.length > 0 && (
                <section>
                  <h4 className="text-lg font-semibold mb-3">
                    Contactos de emergencia
                  </h4>
                  <ul className="space-y-2">
                    {profile.EmergencyContact.map(
                      (contact: EmergencyContact) => (
                        <li
                          key={contact.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-slate-600">
                              {contact.relation}
                            </p>
                            {contact.country && (
                              <p className="text-xs text-slate-500">
                                {contact.country}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">{contact.phone}</p>
                            {contact.preferred && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Preferido
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}
            </article>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Información no configurada
              </h3>
              <p className="text-slate-600 mb-6">
                Aún no has configurado tu información de emergencia. Una vez que
                recibas tu sticker, podrás activarlo y añadir tus datos.
              </p>
              {sticker.status === 'SHIPPED' || sticker.status === 'ACTIVE' ? (
                <a
                  href={`/profile/new?stickerId=${sticker.id}`}
                  className="btn btn-primary"
                >
                  Configurar información
                </a>
              ) : (
                <p className="text-sm text-slate-500">
                  Disponible cuando tu sticker sea enviado
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <a href="/account" className="btn btn-secondary">
          ← Volver a mi cuenta
        </a>
        {sticker.status === 'ACTIVE' && profile && (
          <a href={`/s/${sticker.slug}`} className="btn" target="_blank">
            Ver perfil público
          </a>
        )}
        {(sticker.status === 'SHIPPED' || sticker.status === 'ACTIVE') && (
          <a
            href={`/profile/new?stickerId=${sticker.id}`}
            className="btn btn-primary"
          >
            {profile ? 'Editar información' : 'Configurar información'}
          </a>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <p>
          Esta es una vista previa de cómo se verá tu información en caso de
          emergencia.
        </p>
      </div>
    </div>
  );
}
