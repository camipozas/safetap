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

const getStatusText = (paymentStatus: string, stickerStatus?: string) => {
  // Los estados de pago críticos (rechazado, cancelado, pendiente) tienen prioridad sobre el sticker
  switch (paymentStatus) {
    case 'REJECTED':
      return { text: '❌ Rechazado', color: 'bg-red-100 text-red-800' };
    case 'CANCELLED':
      return { text: '🚫 Cancelado', color: 'bg-gray-100 text-gray-800' };
    case 'PENDING':
      return { text: '⏳ Pendiente', color: 'bg-yellow-100 text-yellow-800' };
  }

  // Si hay un sticker y el pago no está en estado crítico, mostrar el estado del sticker
  if (stickerStatus) {
    switch (stickerStatus) {
      case 'ORDERED':
        return { text: '📝 Creada', color: 'bg-blue-100 text-blue-800' };
      case 'PAID':
        return { text: '💰 Pagada', color: 'bg-green-100 text-green-800' };
      case 'PRINTING':
        return {
          text: '🖨️ Imprimiendo',
          color: 'bg-purple-100 text-purple-800',
        };
      case 'SHIPPED':
        return { text: '📦 Enviado', color: 'bg-indigo-100 text-indigo-800' };
      case 'ACTIVE':
        return { text: '✅ Activo', color: 'bg-emerald-100 text-emerald-800' };
      case 'LOST':
        return { text: '❌ Perdido', color: 'bg-red-100 text-red-800' };
      default:
        return { text: stickerStatus, color: 'bg-gray-100 text-gray-800' };
    }
  }

  // Estados de pago restantes cuando no hay sticker
  switch (paymentStatus) {
    case 'PAID':
      return { text: '💰 Pagado', color: 'bg-green-100 text-green-800' };
    case 'VERIFIED':
      return {
        text: '✅ Verificado',
        color: 'bg-emerald-100 text-emerald-800',
      };
    default:
      return { text: paymentStatus, color: 'bg-gray-100 text-gray-800' };
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
                    {(() => {
                      const status = getStatusText(
                        payment.estado,
                        payment.stickerStatus
                      );
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.text}
                        </span>
                      );
                    })()}
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
