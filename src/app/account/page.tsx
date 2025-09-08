import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import ActivateStickerButton from '@/components/ActivateStickerButton';
import BankAccountInfo from '@/components/BankAccountInfo';
import EditProfileButton from '@/components/EditProfileButton';
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
            Payment: {
              include: {
                Sticker: true,
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
        Payment: {
          include: {
            Sticker: true,
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

      {/* Mostrar información bancaria si hay referencia de pago */}
      {resolvedSearchParams?.ref && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Pago Pendiente
              </h4>
              <p className="text-blue-700 text-sm">
                Tienes un pago pendiente. Usa la información bancaria de abajo
                para realizar la transferencia.
              </p>
            </div>
          </div>
          <BankAccountInfo
            paymentReference={{
              reference: resolvedSearchParams.ref,
              amount:
                user.Payment.find(
                  (payment) => payment.reference === resolvedSearchParams.ref
                )?.amount || 15000,
              description: 'Pago de sticker SafeTap',
            }}
          />
        </div>
      )}

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

      <section>
        <h2 className="text-xl font-semibold">Mis stickers</h2>
        <ul className="mt-2 grid gap-4">
          {user.Payment?.filter(
            (p) => p.Sticker && p.Sticker.ownerId === user.id
          ).map((payment) => {
            const s = payment.Sticker!;
            const quantity = payment.quantity || 1;

            // Log para debugging - verificar que el sticker pertenece al usuario
            console.log('🔍 AccountPage: Showing sticker:', {
              stickerId: s.id,
              stickerOwnerId: s.ownerId,
              currentUserId: user.id,
              isOwner: s.ownerId === user.id,
              stickerName: s.nameOnSticker,
            });

            return (
              <li key={payment.id} className="rounded border bg-white p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Sticker Preview */}
                  <div className="flex-shrink-0">
                    <StickerPreview
                      name={s.nameOnSticker}
                      flagCode={s.flagCode}
                      stickerColor={s.stickerColor || '#f1f5f9'}
                      textColor={s.textColor || '#000000'}
                      showRealQR={
                        s.status === 'SHIPPED' || s.status === 'ACTIVE'
                      }
                      stickerId={s.id}
                      serial={s.serial}
                      className="mx-auto lg:mx-0"
                    />
                  </div>

                  {/* Sticker Info */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {s.nameOnSticker}
                        {quantity > 1 && (
                          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {quantity} stickers
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-600">
                        País: {s.flagCode}
                      </p>

                      {/* Estado del sticker */}
                      {s.status === 'ORDERED' &&
                        payment.status !== 'REJECTED' && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <span className="text-lg">⏳</span>
                              <div className="ml-2">
                                <p className="font-medium text-yellow-800">
                                  Pendiente de pago
                                </p>
                                <p className="text-yellow-700 text-sm mt-1">
                                  Realiza la transferencia bancaria para
                                  procesar tu pedido
                                  {quantity > 1 && ` (${quantity} stickers)`}
                                </p>
                              </div>
                            </div>
                            {payment.reference ? (
                              <Link
                                className="mt-3 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded transition-colors inline-block"
                                href={`/bank-details?ref=${encodeURIComponent(payment.reference)}`}
                              >
                                Ver datos bancarios
                              </Link>
                            ) : (
                              <span className="mt-3 text-sm bg-gray-400 text-white px-3 py-1.5 rounded inline-block cursor-not-allowed">
                                Referencia no disponible
                              </span>
                            )}
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
                              <p className="font-medium text-blue-800">
                                Enviado
                              </p>
                              <p className="text-blue-700 text-sm mt-1">
                                Tu sticker está en camino. Revisa tu email para
                                el tracking
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
                              <p className="font-medium text-red-800">
                                Perdido
                              </p>
                              <p className="text-red-700 text-sm mt-1">
                                Contacta con soporte para solicitar un reemplazo
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mostrar estado del pago más reciente para mayor claridad */}
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                        <p>
                          Estado del pago:{' '}
                          <span className="font-medium">
                            {payment.status === 'VERIFIED'
                              ? '✅ Verificado'
                              : payment.status === 'PAID'
                                ? '💰 Confirmado'
                                : payment.status === 'PENDING'
                                  ? '⏳ Pendiente'
                                  : payment.status === 'REJECTED'
                                    ? '❌ Rechazado'
                                    : payment.status === 'CANCELLED'
                                      ? '🚫 Cancelado'
                                      : payment.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Only show profile buttons if payment is not rejected */}
                      {payment.status !== 'REJECTED' ? (
                        <>
                          <Link
                            className="btn"
                            href={`${process.env.NEXTAUTH_URL}/s/${s.slug}`}
                            target="_blank"
                          >
                            Ver perfil público
                          </Link>
                          <EditProfileButton
                            stickerId={s.id}
                            className="btn btn-secondary"
                          >
                            Editar información de emergencia
                          </EditProfileButton>
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
                      {s.status === 'SHIPPED' && payment && (
                        <ActivateStickerButton
                          stickerId={s.id}
                          hasValidPayment={true}
                          status={s.status}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Payments section - now using API endpoint */}
      <PaymentsTable />
    </div>
  );
}
