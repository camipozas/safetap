'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

type Payment = {
  id: string;
  status:
    | 'PENDING'
    | 'TRANSFER_PAYMENT'
    | 'VERIFIED'
    | 'PAID'
    | 'TRANSFERRED'
    | 'REJECTED'
    | 'CANCELLED';
  amountCents: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  sticker: {
    id: string;
    slug: string;
    nameOnSticker: string;
    status: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
      country: string | null;
    };
  } | null;
};

interface PaymentsTableProps {
  payments: Payment[];
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [statusFilter, setStatusFilter] = useState<Payment['status'] | 'ALL'>(
    'ALL'
  );
  const [countryFilter, setCountryFilter] = useState<string>('ALL');

  // Filter payments based on selected filters
  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== 'ALL' && payment.status !== statusFilter) return false;
    if (
      countryFilter !== 'ALL' &&
      payment.sticker?.owner.country !== countryFilter
    )
      return false;
    return true;
  });

  // Get unique countries for filter
  const countries = Array.from(
    new Set(payments.map((p) => p.sticker?.owner.country).filter(Boolean))
  );

  // Define possible transitions for each status
  const getAvailableTransitions = (
    currentStatus: Payment['status']
  ): Payment['status'][] => {
    const transitions: Record<Payment['status'], Payment['status'][]> = {
      PENDING: ['TRANSFER_PAYMENT', 'PAID', 'REJECTED', 'CANCELLED'],
      TRANSFER_PAYMENT: ['VERIFIED', 'PENDING', 'REJECTED', 'CANCELLED'],
      VERIFIED: ['PAID', 'TRANSFER_PAYMENT', 'REJECTED', 'CANCELLED'],
      PAID: ['TRANSFERRED', 'VERIFIED', 'REJECTED'],
      TRANSFERRED: ['PAID'], // Raramente se revertiría, pero permitimos
      REJECTED: ['PENDING', 'TRANSFER_PAYMENT'], // Permitir reintento
      CANCELLED: ['PENDING'], // Permitir reactivación
    };

    return transitions[currentStatus] || [];
  };

  const getStatusLabel = (status: Payment['status']) => {
    const labels = {
      PENDING: 'Pendiente',
      TRANSFER_PAYMENT: 'En transferencia',
      VERIFIED: 'Verificado',
      PAID: 'Pagado',
      TRANSFERRED: 'Transferido',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
    };
    return labels[status];
  };

  const getStatusBadgeColor = (status: Payment['status']) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      TRANSFER_PAYMENT: 'bg-orange-100 text-orange-800',
      VERIFIED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-purple-100 text-purple-800',
      TRANSFERRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const updatePaymentStatus = async (
    paymentId: string,
    newStatus: Payment['status']
  ) => {
    setLoadingStates((prev) => ({ ...prev, [paymentId]: true }));

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del pago');
      }

      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error al actualizar pago:', err);
      alert('Error al actualizar el estado del pago');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as Payment['status'] | 'ALL')
            }
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="TRANSFER_PAYMENT">En transferencia</option>
            <option value="VERIFIED">Verificado</option>
            <option value="PAID">Pagado</option>
            <option value="TRANSFERRED">Transferido</option>
            <option value="REJECTED">Rechazado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            País
          </label>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="ALL">Todos</option>
            {countries.map((country) => (
              <option key={country || 'unknown'} value={country || ''}>
                {country || 'Sin país'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <span className="text-sm text-gray-600">
            Mostrando {filteredPayments.length} de {payments.length} pagos
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario / Sticker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {payment.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.sticker?.owner.name ||
                          payment.sticker?.owner.email ||
                          'Sin usuario'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.sticker
                          ? `${payment.sticker.nameOnSticker} (${payment.sticker.slug})`
                          : 'Sin sticker'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.amountCents, payment.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        payment.status
                      )}`}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {getAvailableTransitions(payment.status).map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updatePaymentStatus(payment.id, status)
                          }
                          disabled={loadingStates[payment.id]}
                          className="text-xs"
                        >
                          {loadingStates[payment.id] ? (
                            <RotateCcw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ChevronRight className="h-3 w-3 mr-1" />
                              {getStatusLabel(status)}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredPayments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white shadow rounded-lg p-4 border"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {payment.sticker?.owner.name ||
                    payment.sticker?.owner.email ||
                    'Sin usuario'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {payment.sticker
                    ? `${payment.sticker.nameOnSticker} (${payment.sticker.slug})`
                    : 'Sin sticker'}
                </p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                  payment.status
                )}`}
              >
                {getStatusLabel(payment.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <span className="text-gray-500">Monto:</span>
                <div className="font-medium">
                  {formatCurrency(payment.amountCents, payment.currency)}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Fecha:</span>
                <div className="font-medium">
                  {formatDateTime(payment.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {getAvailableTransitions(payment.status).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  onClick={() => updatePaymentStatus(payment.id, status)}
                  disabled={loadingStates[payment.id]}
                  className="text-xs"
                >
                  {loadingStates[payment.id] ? (
                    <RotateCcw className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" />
                      {getStatusLabel(status)}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron pagos con los filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
}
