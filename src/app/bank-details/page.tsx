import { notFound } from 'next/navigation';

import BankAccountInfo from '@/components/BankAccountInfo';
import CloseWindowButton from '@/components/CloseWindowButton';

interface PaymentData {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
    country: string | null;
  };
  sticker: {
    nameOnSticker: string;
    flagCode: string;
    status: string;
  } | null;
}

async function getPaymentData(reference: string): Promise<PaymentData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/payments/by-reference/${encodeURIComponent(reference)}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(
        'API response not ok:',
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment data:', error);
    return null;
  }
}

export default async function BankDetailsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const resolvedSearchParams = await searchParams;
  const reference = resolvedSearchParams?.ref;

  if (!reference) {
    notFound();
  }

  const paymentData = await getPaymentData(reference);

  if (!paymentData) {
    notFound();
  }

  const stickerDescription = paymentData.sticker
    ? `Sticker SafeTap - ${paymentData.sticker.nameOnSticker} (${paymentData.sticker.flagCode})`
    : 'Pago de sticker SafeTap';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Datos para Transferencia Bancaria
            </h1>
            <p className="text-gray-600">
              Realiza la transferencia con los siguientes datos
            </p>
          </div>

          {/* Información Bancaria Principal */}
          <BankAccountInfo
            paymentReference={{
              reference: paymentData.reference,
              amount: paymentData.amount,
              description: stickerDescription,
            }}
          />

          {/* Resumen del Pedido */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-4 flex items-center">
              📋 Resumen del Pedido
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-800 mb-2">
                  <strong>Cliente:</strong> {paymentData.user.name || 'N/A'}
                </p>
                <p className="text-blue-800 mb-2">
                  <strong>Email:</strong> {paymentData.user.email || 'N/A'}
                </p>
                <p className="text-blue-800">
                  <strong>País:</strong> {paymentData.user.country || 'N/A'}
                </p>
              </div>
              <div>
                {paymentData.sticker && (
                  <>
                    <p className="text-blue-800 mb-2">
                      <strong>Nombre en Sticker:</strong>{' '}
                      {paymentData.sticker.nameOnSticker}
                    </p>
                    <p className="text-blue-800 mb-2">
                      <strong>Bandera:</strong> {paymentData.sticker.flagCode}
                    </p>
                  </>
                )}
                <p className="text-blue-800">
                  <strong>Estado:</strong>{' '}
                  <span className="capitalize">
                    {paymentData.status.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Proceso Post-Pago */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-green-900 mb-3 flex items-center">
              📋 ¿Qué pasa después?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                <p className="mb-2">
                  • Verificaremos tu pago en 1-2 días hábiles
                </p>
                <p className="mb-2">
                  • Tu sticker entrará en cola de impresión
                </p>
              </div>
              <div>
                <p className="mb-2">
                  • Te notificaremos cuando esté listo para envío
                </p>
                <p>• Recibirás tu sticker en 3-5 días hábiles</p>
              </div>
            </div>
          </div>

          {/* Botón de Cerrar */}
          <div className="text-center">
            <CloseWindowButton className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Cerrar ventana
            </CloseWindowButton>
          </div>
        </div>
      </div>
    </div>
  );
}
