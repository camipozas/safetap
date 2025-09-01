import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import ActivateStickerButton from '@/components/ActivateStickerButton';
import PaymentReferenceHandler from '@/components/PaymentReferenceHandler';
import { PaymentsTable } from '@/components/PaymentsTable';
import StickerPreview from '@/components/StickerPreview';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  let user = null;
  const session = await auth();
  const resolvedSearchParams = await searchParams;

  if (
    !session?.user?.email &&
    resolvedSearchParams?.['dev-auth'] &&
    process.env.NODE_ENV === 'development'
  ) {
    const devSessionToken = resolvedSearchParams['dev-auth'];
    try {
      const devSession = await prisma.session.findUnique({
        where: { sessionToken: devSessionToken },
        include: { user: true },
      });

      if (devSession && devSession.expires > new Date()) {
        user = await prisma.user.findUnique({
          where: { id: devSession.userId },
          include: {
            Sticker: {
              include: {
                Payment: {
                  orderBy: { createdAt: 'desc' },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      }
    } catch (error) {
      console.error('Dev auth error:', error);
    }
  }

  // Normal authentication
  if (!user) {
    if (!session?.user?.email) {
      // Preserve the current URL (including ref parameter) for after login
      const currentUrl = resolvedSearchParams?.ref
        ? `/account?ref=${encodeURIComponent(resolvedSearchParams.ref)}`
        : '/account';
      redirect(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
    }

    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Sticker: {
          include: {
            Payment: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="grid gap-6">
      {/* Payment reference handler - restores payment ref after login */}
      <Suspense fallback={null}>
        <PaymentReferenceHandler />
      </Suspense>

      {/* Dev Auth Banner */}
      {resolvedSearchParams?.['dev-auth'] &&
        process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-yellow-800 font-medium">
                🔧 Modo desarrollo: Autenticado via dev-login ({user.email})
              </p>
            </div>
          </div>
        )}

      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      {resolvedSearchParams?.ref && (
        <div className="rounded-md border bg-white p-4">
          <p className="font-medium">Referencia de transferencia</p>
          <p className="text-sm text-slate-700">
            Usa este concepto al hacer la transferencia:{' '}
            <span className="font-mono">{resolvedSearchParams.ref}</span>
          </p>
          <p className="text-sm text-slate-700 mt-2">
            Datos bancarios: IBAN ES00 0000 0000 0000 0000 0000 · Beneficiario:
            SafeTap
          </p>
        </div>
      )}
      <section>
        <h2 className="text-xl font-semibold">Mis stickers</h2>
        <ul className="mt-2 grid gap-4">
          {user.Sticker.map((s) => (
            <li key={s.id} className="rounded border bg-white p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Sticker Preview */}
                <div className="flex-shrink-0">
                  <StickerPreview
                    name={s.nameOnSticker}
                    flagCode={s.flagCode}
                    stickerColor={s.stickerColor || '#f1f5f9'}
                    textColor={s.textColor || '#000000'}
                    showRealQR={s.status === 'SHIPPED' || s.status === 'ACTIVE'}
                    stickerId={s.id}
                    serial={s.serial}
                    className="mx-auto lg:mx-0"
                  />
                </div>

                {/* Sticker Info */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{s.nameOnSticker}</h3>
                    <p className="text-sm text-slate-600">País: {s.flagCode}</p>

                    {/* Estado del sticker */}
                    {s.status === 'ORDERED' &&
                      (s.Payment.length === 0 ||
                        s.Payment[0].status !== 'REJECTED') && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-lg">⏳</span>
                            <div className="ml-2">
                              <p className="font-medium text-yellow-800">
                                Pendiente de pago
                              </p>
                              <p className="text-yellow-700 text-sm mt-1">
                                Realiza la transferencia bancaria para procesar
                                tu pedido
                              </p>
                            </div>
                          </div>
                          <Link
                            className="mt-3 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded transition-colors inline-block"
                            href="/datos-bancarios"
                          >
                            Ver datos bancarios
                          </Link>
                        </div>
                      )}

                    {s.status === 'PAID' && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">💰</span>
                          <div className="ml-2">
                            <p className="font-medium text-purple-800">
                              Pago confirmado
                            </p>
                            <p className="text-purple-700 text-sm mt-1">
                              Tu sticker está en cola de impresión
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.status === 'PRINTING' && (
                      <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">🖨️</span>
                          <div className="ml-2">
                            <p className="font-medium text-orange-800">
                              En impresión
                            </p>
                            <p className="text-orange-700 text-sm mt-1">
                              Tu sticker se está imprimiendo y será enviado
                              pronto
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.status === 'SHIPPED' && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">📦</span>
                          <div className="ml-2">
                            <p className="font-medium text-blue-800">Enviado</p>
                            <p className="text-blue-700 text-sm mt-1">
                              Tu sticker está en camino. Revisa tu email para el
                              tracking
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.status === 'ACTIVE' && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">✅</span>
                          <div className="ml-2">
                            <p className="font-medium text-green-800">
                              Activo y funcionando
                            </p>
                            <p className="text-green-700 text-sm mt-1">
                              Tu sticker está activo y listo para emergencias
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {s.status === 'LOST' && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">❌</span>
                          <div className="ml-2">
                            <p className="font-medium text-red-800">Perdido</p>
                            <p className="text-red-700 text-sm mt-1">
                              Contacta con soporte para solicitar un reemplazo
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mostrar estado del pago más reciente para mayor claridad */}
                    {s.Payment.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                        <p>
                          Estado del pago:{' '}
                          <span className="font-medium">
                            {s.Payment[0].status === 'VERIFIED'
                              ? '✅ Verificado'
                              : s.Payment[0].status === 'PAID'
                                ? '💰 Confirmado'
                                : s.Payment[0].status === 'TRANSFERRED'
                                  ? '💳 Transferido'
                                  : s.Payment[0].status === 'PENDING'
                                    ? '⏳ Pendiente'
                                    : s.Payment[0].status === 'REJECTED'
                                      ? '❌ Rechazado'
                                      : s.Payment[0].status === 'CANCELLED'
                                        ? '🚫 Cancelado'
                                        : s.Payment[0].status}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Only show profile buttons if payment is not rejected */}
                    {s.Payment.length === 0 ||
                    s.Payment[0].status !== 'REJECTED' ? (
                      <>
                        <Link
                          className="btn"
                          href={`${process.env.NEXTAUTH_URL}/s/${s.slug}`}
                          target="_blank"
                        >
                          Ver perfil público
                        </Link>
                        <Link
                          className="btn btn-secondary"
                          href={`/profile/new?stickerId=${s.id}`}
                        >
                          Editar información
                        </Link>
                      </>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-lg">❌</span>
                          <div className="ml-2">
                            <p className="font-medium text-red-800">
                              Pago rechazado
                            </p>
                            <p className="text-red-700 text-sm mt-1">
                              Por favor, contacta con soporte para más
                              información
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {s.status === 'SHIPPED' && s.Payment.length > 0 && (
                      <ActivateStickerButton
                        stickerId={s.id}
                        hasValidPayment={s.Payment.length > 0}
                        status={s.status}
                      />
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Payments section - now using API endpoint */}
      <PaymentsTable />
    </div>
  );
}
