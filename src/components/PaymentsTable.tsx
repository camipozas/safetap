'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  fecha: string;
  producto: string;
  monto: string;
  estado: string;
  stickerSlug?: string;
  stickerName?: string;
  stickerStatus?: string;
}

const getStickerStatusText = (status: string) => {
  switch (status) {
    case 'ORDERED':
      return '📝 Creada';
    case 'PAID':
      return '💰 Pagada';
    case 'PRINTING':
      return '🖨️ Imprimiendo';
    case 'SHIPPED':
      return '📦 Enviado';
    case 'ACTIVE':
      return '✅ Activo';
    case 'LOST':
      return '❌ Perdido';
    default:
      return status;
  }
};

export function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await fetch('/api/payments');
        if (!response.ok) {
          throw new Error('Error al cargar los pagos');
        }
        const data = await response.json();
        setPayments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h3>
        <div className="text-red-600 text-sm">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h3>

      {payments.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay pagos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">
                  Fecha
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">
                  Producto
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">
                  Monto
                </th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {payment.fecha}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {payment.producto}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {payment.monto}
                  </td>
                  <td className="py-3 px-3">
                    {payment.stickerStatus ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getStickerStatusText(payment.stickerStatus)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
