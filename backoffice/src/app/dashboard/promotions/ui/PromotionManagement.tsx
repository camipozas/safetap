'use client';

import { useState } from 'react';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  minQuantity: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  active: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromotionManagementProps {
  initialPromotions: Promotion[];
  initialTotal: number;
}

interface CreatePromotionForm {
  name: string;
  description: string;
  minQuantity: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  active: boolean;
  priority: number;
  startDate: string;
  endDate: string;
}

export default function PromotionManagement({
  initialPromotions,
  initialTotal,
}: PromotionManagementProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [total, setTotal] = useState(initialTotal);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CreatePromotionForm>({
    name: '',
    description: '',
    minQuantity: 2,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    active: true,
    priority: 0,
    startDate: '',
    endDate: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      minQuantity: 2,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      active: true,
      priority: 0,
      startDate: '',
      endDate: '',
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
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        minQuantity: form.minQuantity,
        discountType: form.discountType,
        discountValue: form.discountValue,
        active: form.active,
        priority: form.priority,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };

      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la promoción');
      }

      // Add new promotion to the list
      setPromotions([result, ...promotions]);
      setTotal(total + 1);
      setSuccess('Promoción creada exitosamente');
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePromotionStatus = async (
    promotionId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar la promoción');
      }

      const updatedPromotion = await response.json();
      setPromotions(
        promotions.map((p) => (p.id === promotionId ? updatedPromotion : p))
      );
      setSuccess(
        `Promoción ${!currentStatus ? 'activada' : 'desactivada'} exitosamente`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const formatDiscountValue = (type: string, value: number) => {
    return type === 'PERCENTAGE'
      ? `${value}%`
      : `$${value.toLocaleString('es-CL')}`;
  };

  const calculateExampleDiscount = (promotion: Promotion) => {
    const basePrice = 6990; // Precio base por sticker
    const exampleQuantity = promotion.minQuantity;
    const subtotal = basePrice * exampleQuantity;

    let discount = 0;
    if (promotion.discountType === 'PERCENTAGE') {
      discount = Math.round(subtotal * (promotion.discountValue / 100));
    } else {
      discount = Math.min(promotion.discountValue, subtotal);
    }

    const finalTotal = subtotal - discount;

    return {
      subtotal,
      discount,
      finalTotal,
      quantity: exampleQuantity,
    };
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
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                >
                  <svg
                    className="h-3 w-3"
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
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <svg
                    className="h-3 w-3"
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
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Promociones por Cantidad ({total})
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona descuentos automáticos basados en cantidad de artículos
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
          {showCreateForm ? 'Cancelar' : 'Crear Promoción'}
        </button>
      </div>

      {/* How it Works Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              ¿Cómo funcionan los descuentos por cantidad?
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">📊 Sistema de Niveles</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Se aplica el descuento de mayor nivel alcanzado</li>
                    <li>• Ejemplo: 5 stickers → descuento del 15% (no 10%)</li>
                    <li>
                      • La prioridad determina qué promoción aplicar en caso de
                      empate
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💰 Tipos de Descuento</h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • <strong>Porcentaje:</strong> Se aplica sobre el total
                      del carrito
                    </li>
                    <li>
                      • <strong>Monto fijo:</strong> Se resta del total (nunca
                      negativo)
                    </li>
                    <li>
                      • El descuento se aplica a todos los productos del carrito
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🔍 Ejemplo Práctico
                </h4>
                <div className="text-xs space-y-1">
                  <div>
                    📦 Cliente compra 3 stickers a $6.990 c/u = $20.970 total
                  </div>
                  <div>
                    ✅ Se aplica promoción &ldquo;15% descuento por 2+
                    stickers&rdquo;
                  </div>
                  <div>💵 Descuento: $20.970 × 15% = $3.146</div>
                  <div>
                    🎯 <strong>Total final: $17.824</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Crear Promoción por Cantidad
          </h3>

          {/* Configuration Tips */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              💡 Consejos de Configuración
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • <strong>Cantidad mínima:</strong> Considera el comportamiento
                de compra típico de tus clientes
              </li>
              <li>
                • <strong>Descuentos escalonados:</strong> Usa 10% para 2+, 15%
                para 5+, 20% para 10+ items
              </li>
              <li>
                • <strong>Prioridad:</strong> Asigna mayor prioridad a
                promociones más específicas o temporales
              </li>
              <li>
                • <strong>Fechas:</strong> Las promociones sin fechas están
                siempre activas
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descuento por cantidad"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Descripción
                </label>
                <input
                  type="text"
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la promoción"
                />
              </div>

              <div>
                <label
                  htmlFor="minQuantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cantidad Mínima *
                </label>
                <input
                  type="number"
                  id="minQuantity"
                  required
                  min="1"
                  value={form.minQuantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="discountType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de Descuento *
                </label>
                <select
                  id="discountType"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="FIXED">Monto Fijo</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="discountValue"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Valor del Descuento *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="discountValue"
                    required
                    min="0"
                    max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                    step={form.discountType === 'PERCENTAGE' ? 1 : 100}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">
                      {form.discountType === 'PERCENTAGE' ? '%' : 'CLP'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prioridad
                </label>
                <input
                  type="number"
                  id="priority"
                  min="0"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número mayor = prioridad más alta
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Inicio
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Fin
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="active"
                className="ml-2 block text-sm text-gray-700"
              >
                Activar promoción inmediatamente
              </label>
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
                disabled={
                  isLoading || !form.name.trim() || form.discountValue <= 0
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando...' : 'Crear Promoción'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Stats Summary */}
        {promotions.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {promotions.filter((p) => p.active).length}
                </div>
                <div className="text-xs text-gray-500">Promociones Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    const activePromotions = promotions.filter((p) => p.active);
                    return activePromotions.length > 0
                      ? Math.min(...activePromotions.map((p) => p.minQuantity))
                      : 0;
                  })()}
                </div>
                <div className="text-xs text-gray-500">
                  Mín. Cantidad para Descuento
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const percentagePromotions = promotions.filter(
                      (p) => p.active && p.discountType === 'PERCENTAGE'
                    );
                    return percentagePromotions.length > 0
                      ? Math.max(
                          ...percentagePromotions.map((p) => p.discountValue)
                        )
                      : 0;
                  })()}
                  %
                </div>
                <div className="text-xs text-gray-500">Máx. Descuento (%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {(() => {
                    const activePromotions = promotions.filter((p) => p.active);
                    const uniqueQuantities = Array.from(
                      new Set(activePromotions.map((p) => p.minQuantity))
                    );
                    return uniqueQuantities.length;
                  })()}
                </div>
                <div className="text-xs text-gray-500">
                  Niveles de Descuento
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promoción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Mínima
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {promotion.name}
                    </div>
                    {promotion.description && (
                      <div className="text-sm text-gray-500">
                        {promotion.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {promotion.minQuantity}+ items
                    </div>
                    <div className="text-xs text-gray-500">
                      Se activa con {promotion.minQuantity} o más productos
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDiscountValue(
                        promotion.discountType,
                        promotion.discountValue
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {promotion.discountType === 'PERCENTAGE'
                        ? 'Porcentaje'
                        : 'Monto fijo'}
                    </div>
                    {(() => {
                      const example = calculateExampleDiscount(promotion);
                      return (
                        <div className="text-xs text-blue-600 mt-1">
                          Ej: {example.quantity} stickers → $
                          {example.discount.toLocaleString('es-CL')} desc.
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {promotion.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        promotion.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promotion.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.startDate ? (
                      <div>
                        <div>
                          Desde:{' '}
                          {new Date(promotion.startDate).toLocaleDateString(
                            'es-ES'
                          )}
                        </div>
                        {promotion.endDate && (
                          <div>
                            Hasta:{' '}
                            {new Date(promotion.endDate).toLocaleDateString(
                              'es-ES'
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      'Sin límite'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() =>
                        togglePromotionStatus(promotion.id, promotion.active)
                      }
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                        promotion.active
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {promotion.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {promotions.length === 0 && (
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
              No hay promociones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Crea tu primera promoción por cantidad para empezar.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Crear Promoción
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
