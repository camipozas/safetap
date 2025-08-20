import Link from 'next/link';
import { redirect } from 'next/navigation';

import ActivateStickerButton from '@/components/ActivateStickerButton';
import StickerPreview from '@/components/StickerPreview';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  let user = null;
  const session = await auth();
  const resolvedSearchParams = await searchParams;

  // Special manage for dev-auth
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
            stickers: true,
            payments: { orderBy: { createdAt: 'desc' } },
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
      redirect('/login');
    }

    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        stickers: {
          include: {
            payments: {
              where: { status: 'VERIFIED' },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            sticker: {
              select: {
                nameOnSticker: true,
                status: true,
                serial: true,
              },
            },
          },
        },
      },
    });
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="grid gap-6">
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
          {user.stickers.map((s) => (
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
                    <p className="text-sm text-slate-600">
                      Serial: <span className="font-mono">{s.serial}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Estado:{' '}
                      <span
                        className={`font-medium px-2 py-1 rounded text-xs ${
                          s.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : s.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : s.status === 'PRINTING'
                                ? 'bg-orange-100 text-orange-800'
                                : s.status === 'PAID'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {s.status === 'ORDERED' && '📝 Creada'}
                        {s.status === 'PAID' && '💰 Pagada'}
                        {s.status === 'PRINTING' && '🖨️ Imprimiendo'}
                        {s.status === 'SHIPPED' && '📦 Enviada'}
                        {s.status === 'ACTIVE' && '✅ Activa'}
                        {s.status === 'LOST' && '❌ Perdida'}
                      </span>
                    </p>

                    {/* Información adicional según el estado */}
                    {s.status === 'ORDERED' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <p className="text-yellow-800">
                          <strong>⏳ Pendiente de pago</strong>
                        </p>
                        <p className="text-yellow-700 text-xs mt-1">
                          Realiza la transferencia bancaria para procesar tu
                          pedido
                        </p>
                        <Link
                          className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors inline-block"
                          href="/datos-bancarios"
                          target="_blank"
                        >
                          Ver datos bancarios
                        </Link>
                      </div>
                    )}

                    {s.status === 'PAID' && (
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                        <p className="text-purple-800">
                          <strong>✨ Pago confirmado</strong>
                        </p>
                        <p className="text-purple-700 text-xs mt-1">
                          Tu sticker está en cola de impresión
                        </p>
                      </div>
                    )}

                    {s.status === 'PRINTING' && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <p className="text-orange-800">
                          <strong>🖨️ En impresión</strong>
                        </p>
                        <p className="text-orange-700 text-xs mt-1">
                          Tu sticker se está imprimiendo y será enviado pronto
                        </p>
                      </div>
                    )}

                    {s.status === 'SHIPPED' && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <p className="text-blue-800">
                          <strong>📦 Enviado</strong>
                        </p>
                        <p className="text-blue-700 text-xs mt-1">
                          Tu sticker está en camino. Revisa tu email para el
                          tracking
                        </p>
                      </div>
                    )}

                    {s.status === 'ACTIVE' && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <p className="text-green-800">
                          <strong>✅ Activo y funcionando</strong>
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          Tu sticker está activo y listo para emergencias
                        </p>
                      </div>
                    )}

                    {/* Información técnica oculta para usuarios finales */}
                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <p className="text-sm text-slate-600">
                          URL pública:{' '}
                          <span className="font-mono">/s/{s.slug}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Serial: {s.serial}
                        </p>
                        {s.stickerColor && (
                          <p className="text-xs text-slate-500 mt-1">
                            Colores:{' '}
                            <span className="font-mono">{s.stickerColor}</span>{' '}
                            / <span className="font-mono">{s.textColor}</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                    {s.status === 'SHIPPED' ? (
                      <span className="btn btn-primary opacity-50 cursor-not-allowed">
                        Funcionalidad en desarrollo
                      </span>
                    ) : s.status !== 'ACTIVE' ? (
                      <ActivateStickerButton stickerId={s.id} />
                    ) : null}
                    {s.status === 'ACTIVE' && (
                      <Link
                        className="btn btn-secondary text-sm"
                        href={`/api/qr/generate?url=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/s/${s.slug}`)}&format=png&size=512&dpi=300`}
                        target="_blank"
                      >
                        Descargar QR PNG
                      </Link>
                    )}
                    {s.status === 'ACTIVE' && (
                      <Link
                        className="btn btn-secondary text-sm"
                        href={`/api/qr/generate?url=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/s/${s.slug}`)}&format=svg`}
                        target="_blank"
                      >
                        Descargar QR SVG
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Pagos</h2>
        <div className="mt-4">
          {user.payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {user.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(p.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            Sticker SafeTap
                          </p>
                          {/* Temporal: comentado hasta corregir tipos */}
                          {/* {p.sticker && (
                            <p className="text-gray-600 text-xs">
                              {p.sticker.nameOnSticker} • {p.sticker.serial}
                            </p>
                          )} */}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${(p.amountCents / 100).toLocaleString('es-ES')}{' '}
                        {p.currency}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.status === 'VERIFIED' || p.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : p.status === 'PENDING' ||
                                  p.status === 'TRANSFER_PAYMENT'
                                ? 'bg-yellow-100 text-yellow-800'
                                : p.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(p.status === 'VERIFIED' || p.status === 'PAID') &&
                            '✅ Confirmado'}
                          {(p.status === 'PENDING' ||
                            p.status === 'TRANSFER_PAYMENT') &&
                            '⏳ Pendiente'}
                          {p.status === 'REJECTED' && '❌ Rechazado'}
                          {p.status === 'CANCELLED' && '🚫 Cancelado'}
                          {p.status === 'TRANSFERRED' && '💸 Transferido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
