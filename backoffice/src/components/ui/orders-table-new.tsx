'use client';

import {
  analyzePayments,
  checkOrderConsistency,
  getAvailableStatusTransitions,
  getDisplayStatus,
  getPaymentDisplayInfo,
  type OrderStatus,
} from '@/lib/order-helpers';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { Order } from '@/types/dashboard';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  Link,
  User,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';
import { Button } from './button';
import StickerPreview from './sticker-preview';

interface OrdersTableNewProps {
  orders: Order[];
}

export default function OrdersTableNew({ orders }: OrdersTableNewProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [showPreview, setShowPreview] = useState<Order | null>(null);
  const [fixingInconsistencies, setFixingInconsistencies] = useState(false);

  // Filter orders based on selected filters
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (countryFilter !== 'ALL' && order.owner.country !== countryFilter)
      return false;
    return true;
  });

  // Get unique countries for filter
  const countries = Array.from(
    new Set(
      orders
        .map((o) => o.owner.country)
        .filter((country): country is string => Boolean(country))
    )
  );

  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      ORDERED: 'Creada',
      PAID: 'Pagada',
      PRINTING: 'Imprimiendo',
      SHIPPED: 'Enviada',
      ACTIVE: 'Activa',
      LOST: 'Perdida',
      REJECTED: 'Rechazada',
      CANCELLED: 'Cancelada',
    };
    return labels[status];
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setLoadingStates((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const downloadQR = async (order: Order) => {
    try {
      const qrUrl = `${window.location.origin.replace(':3001', '')}/s/${order.slug}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: order.textColor,
          light: order.stickerColor,
        },
      });

      const link = document.createElement('a');
      link.download = `safetap-qr-${order.serial}.png`;
      link.href = qrDataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar QR:', err);
      alert('Error al generar el código QR');
    }
  };

  const viewStickerPreview = (order: Order) => {
    setShowPreview(order);
  };

  // Select/deselect all orders
  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  // Toggle individual order selection
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Fix inconsistencies automatically
  const fixInconsistencies = async () => {
    setFixingInconsistencies(true);
    try {
      const response = await fetch('/api/admin/orders/fix-inconsistencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al arreglar inconsistencias');
      }

      const result = await response.json();
      alert(`Se arreglaron ${result.updates.length} inconsistencias`);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error al arreglar inconsistencias:', err);
      alert('Error al arreglar inconsistencias');
    } finally {
      setFixingInconsistencies(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | 'ALL')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="ORDERED">Creada</option>
              <option value="PAID">Pagada</option>
              <option value="PRINTING">Imprimiendo</option>
              <option value="SHIPPED">Enviada</option>
              <option value="ACTIVE">Activa</option>
              <option value="LOST">Perdida</option>
              <option value="REJECTED">Rechazada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={fixInconsistencies}
              disabled={fixingInconsistencies}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              {fixingInconsistencies
                ? 'Arreglando...'
                : 'Arreglar Inconsistencias'}
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            {filteredOrders.length} de {orders.length} órdenes
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.size === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Usuario
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Estado
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  País
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Grupo Sang.
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Contactos
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Pago
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Fecha
                </th>
                <th className="text-left p-4 font-medium text-gray-900">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const paymentInfo = analyzePayments(order.payments);
                const displayStatus = getDisplayStatus(
                  order.status,
                  paymentInfo
                );
                const paymentDisplay = getPaymentDisplayInfo(paymentInfo);
                const consistency = checkOrderConsistency(
                  order.status,
                  paymentInfo
                );
                const availableTransitions = getAvailableStatusTransitions(
                  order.status,
                  paymentInfo
                );

                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {order.owner.name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.owner.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {/* Primary Status */}
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus.primaryStatus)}`}
                          >
                            {getStatusLabel(displayStatus.primaryStatus)}
                          </span>
                          {!consistency.isConsistent && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>

                        {/* Secondary Statuses */}
                        {displayStatus.secondaryStatuses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {displayStatus.secondaryStatuses.map(
                              (status, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                                >
                                  ▲ {getStatusLabel(status)}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {/* Inconsistency Warning */}
                        {!consistency.isConsistent && (
                          <div className="flex items-center space-x-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>Inconsistencia</span>
                          </div>
                        )}

                        {/* Available Transitions */}
                        {availableTransitions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {availableTransitions.map((transition) => (
                              <Button
                                key={transition.status}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateOrderStatus(order.id, transition.status)
                                }
                                disabled={loadingStates[order.id]}
                                className="text-xs h-6 px-2"
                                title={transition.description}
                              >
                                {transition.direction === 'backward' ? (
                                  <ChevronLeft className="w-3 h-3 mr-1" />
                                ) : transition.direction === 'special' ? (
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 mr-1" />
                                )}
                                {getStatusLabel(transition.status)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {order.owner.country ? (
                          <span className="font-medium">
                            {order.owner.country}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin país</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {order.profile?.bloodType ? (
                          <span className="text-red-600 font-medium">
                            🩸 {order.profile.bloodType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {order.profile?.contacts?.[0] ? (
                          <div>
                            <div className="font-medium">
                              {order.profile.contacts[0].name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {order.profile.contacts[0].phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {paymentDisplay.amount}
                        </div>
                        <div
                          className={`text-xs ${paymentDisplay.statusColor}`}
                        >
                          {paymentDisplay.status}
                        </div>
                        {!consistency.isConsistent &&
                          consistency.issues.length > 0 && (
                            <div className="text-xs text-red-600">
                              ⚠️ {consistency.issues[0]}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewStickerPreview(order)}
                          className="text-xs h-8 w-8 p-0"
                          title="Ver sticker"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const profileUrl = `/dashboard/users/${order.owner.id}/profile`;
                            window.open(profileUrl, '_blank');
                          }}
                          className="text-xs h-8 w-8 p-0"
                          title="Ver perfil"
                        >
                          <Link className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQR(order)}
                          className="text-xs h-8 w-8 p-0"
                          title="Descargar QR"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `/dashboard/users/${order.owner.id}`,
                              '_blank'
                            );
                          }}
                          className="text-xs h-8 w-8 p-0"
                          title="Editar usuario"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `/dashboard/users/${order.owner.id}/profile`,
                              '_blank'
                            );
                          }}
                          className="text-xs h-8 w-8 p-0"
                          title="Ver usuario"
                        >
                          <User className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticker Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Vista previa del sticker
              </h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <StickerPreview
              sticker={{
                id: showPreview.id,
                slug: showPreview.slug,
                serial: showPreview.serial,
                nameOnSticker: showPreview.nameOnSticker,
                flagCode: showPreview.flagCode,
                stickerColor: showPreview.stickerColor,
                textColor: showPreview.textColor,
                profile: showPreview.profile,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
