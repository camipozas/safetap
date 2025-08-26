'use client';

import { useState } from 'react';

interface ActivateStickerButtonProps {
  stickerId: string;
  hasValidPayment: boolean;
  status: string;
}

export default function ActivateStickerButton({
  stickerId,
  hasValidPayment,
  status,
}: ActivateStickerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canActivate = hasValidPayment && status === 'SHIPPED';

  const handleActivate = async () => {
    if (!canActivate) {
      return;
    }

    // eslint-disable-next-line no-alert
    const confirmed = confirm(
      '¿Estás seguro de que quieres activar este sticker? Una vez activado, tu información será pública cuando alguien escanee el QR.'
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stickers/${stickerId}/activate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        setError(data.error || 'Error al activar el sticker');
      }
    } catch (err) {
      console.error('Error activating sticker:', err);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidPayment) {
    return (
      <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">
          💳 Pago pendiente de verificación
        </p>
        <p className="text-xs text-yellow-600">
          Una vez que se verifique tu pago, podrás activar el sticker cuando lo
          recibas.
        </p>
      </div>
    );
  }

  if (status !== 'SHIPPED') {
    return (
      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">📦 Esperando envío</p>
        <p className="text-xs text-blue-600">
          Podrás activar tu sticker una vez que sea enviado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
          canActivate && !isLoading
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleActivate}
        disabled={!canActivate || isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Activando...
          </>
        ) : (
          '✅ Activar sticker'
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-600 text-center">
        ⚠️ Solo activa cuando hayas recibido físicamente tu sticker
      </p>
    </div>
  );
}
