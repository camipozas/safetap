'use client';

import { DiscountType } from '@prisma/client';
import { useState } from 'react';

interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  amount: number;
  active: boolean;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  usageCount: number;
  createdAt: string;
  createdBy?: {
    email: string;
    name?: string | null;
  } | null;
  _count: {
    redemptions: number;
  };
}

interface DiscountManagementProps {
  initialDiscounts: DiscountCode[];
  initialTotal: number;
}

interface CreateDiscountForm {
  code: string;
  type: DiscountType;
  amount: number;
  expiresAt: string;
  maxRedemptions: string;
  active: boolean;
}

export default function DiscountManagement({
  initialDiscounts,
  initialTotal,
}: DiscountManagementProps) {
  const [discounts, setDiscounts] = useState<DiscountCode[]>(initialDiscounts);
  const [total, setTotal] = useState(initialTotal);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CreateDiscountForm>({
    code: '',
    type: 'PERCENT',
    amount: 0,
    expiresAt: '',
    maxRedemptions: '',
    active: true,
  });

  const resetForm = () => {
    setForm({
      code: '',
      type: 'PERCENT',
      amount: 0,
      expiresAt: '',
      maxRedemptions: '',
      active: true,
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        amount: form.amount,
        expiresAt: form.expiresAt || undefined,
        maxRedemptions: form.maxRedemptions
          ? parseInt(form.maxRedemptions)
          : undefined,
        active: form.active,
      };

      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el código');
      }

      // Add new discount to the list
      setDiscounts([result, ...discounts]);
      setTotal(total + 1);
      setSuccess('Código de descuento creado exitosamente');
      resetForm();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (discountId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar el código');
      }

      const updatedDiscount = await response.json();
      setDiscounts(
        discounts.map((d) => (d.id === discountId ? updatedDiscount : d))
      );
      setSuccess(
        `Código ${!currentActive ? 'activado' : 'desactivado'} exitosamente`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const formatAmount = (amount: number, type: DiscountType) => {
    if (type === 'PERCENT') {
      return `${amount}%`;
    }
    return `$${amount.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'Sin expiración';
    }
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="text-green-400 hover:text-green-600"
                onClick={() => setSuccess(null)}
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="text-red-400 hover:text-red-600"
                onClick={() => setError(null)}
              >
                <span className="sr-only">Cerrar</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Códigos de Descuento ({total})
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona códigos de descuento para aplicar en el checkout
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (showCreateForm) {
              resetForm();
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {showCreateForm ? 'Cancelar' : 'Crear Código'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Crear Código de Descuento
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Código *
                </label>
                <input
                  type="text"
                  id="code"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="DESCUENTO10"
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo *
                </label>
                <select
                  id="type"
                  required
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as DiscountType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENT">Porcentaje</option>
                  <option value="FIXED">Monto Fijo</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {form.type === 'PERCENT'
                    ? 'Porcentaje (0-100)'
                    : 'Monto en CLP'}{' '}
                  *
                </label>
                <input
                  type="number"
                  id="amount"
                  required
                  min="0"
                  max={form.type === 'PERCENT' ? 100 : undefined}
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={form.type === 'PERCENT' ? '10' : '1000'}
                />
              </div>

              <div>
                <label
                  htmlFor="expiresAt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Expiración
                </label>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="maxRedemptions"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Usos Máximos
                </label>
                <input
                  type="number"
                  id="maxRedemptions"
                  min="1"
                  value={form.maxRedemptions}
                  onChange={(e) =>
                    setForm({ ...form, maxRedemptions: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ilimitado"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Activo
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !form.code.trim() || form.amount <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando...' : 'Crear Código'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo / Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {discount.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatAmount(Number(discount.amount), discount.type)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {discount.type === 'PERCENT'
                        ? 'Porcentaje'
                        : 'Monto fijo'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {discount.usageCount}
                      {discount.maxRedemptions &&
                        ` / ${discount.maxRedemptions}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {discount.maxRedemptions ? 'Con límite' : 'Ilimitado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(discount.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        discount.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {discount.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(discount.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleActive(discount.id, discount.active)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
                        discount.active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {discount.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {discounts.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 01-2 2v-1a2 2 0 00-2-2H8a2 2 0 00-2 2v1a2 2 0 01-2-2h4m4-1v3m0-3h-4m4 0a2 2 0 01-2-2m-4 4v1a2 2 0 002 2h2a2 2 0 002-2v-1"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay códigos de descuento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea tu primer código de descuento para empezar.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Crear Código
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
