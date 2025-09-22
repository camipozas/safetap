'use client';

import {
  analyzePayments,
  checkOrderConsistency,
  getAvailableStatusTransitions,
  getDisplayStatus,
  getPaymentDisplayInfo,
  type OrderStatus,
  type OrderStatusTransition,
} from '@/lib/order-helpers';
import { getQrUrlForSticker } from '@/lib/url-utils';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { Order } from '@/types/dashboard';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';
import { Button } from './button';
import StickerPreview from './sticker-preview';

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
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
    // Use displayStatus for filtering if available, otherwise use status
    const orderStatus = order.displayStatus || order.status;
    if (statusFilter !== 'ALL' && orderStatus !== statusFilter) return false;
    if (countryFilter !== 'ALL' && order.owner.country !== countryFilter)
      return false;
    return true;
  });

  // Get unique countries for filter
  const countries = Array.from(
    new Set(orders.map((o) => o.owner.country).filter(Boolean))
  );

  // Get available transitions using the helper
  const getAvailableTransitions = (
    currentStatus: OrderStatus,
    payments: Order['payments']
  ): OrderStatusTransition[] => {
    const paymentInfo = analyzePayments(payments);
    return getAvailableStatusTransitions(currentStatus, paymentInfo);
  };

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
      // Get the QR URL using the shared utility function
      const qrUrl = await getQrUrlForSticker(order.id, order.slug);

      // Create canvas for the sticker
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Configure the canvas for the sticker (print size)
      canvas.width = 600;
      canvas.height = 900;

      // Background of the sticker
      ctx.fillStyle = order.stickerColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = order.textColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Text of the sticker
      ctx.fillStyle = order.textColor;
      ctx.textAlign = 'center';

      // Name on sticker
      ctx.font = 'bold 32px Arial';
      ctx.fillText(order.nameOnSticker, canvas.width / 2, 60);

      // Flag (emoji)
      ctx.font = '48px Arial';
      ctx.fillText(order.flagCode, canvas.width / 2, 120);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 350,
        margin: 2,
        color: {
          dark: order.textColor,
          light: order.stickerColor,
        },
      });

      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR
        ctx.drawImage(qrImage, 125, 150, 350, 350);

        // Text of emergency
        ctx.font = 'bold 24px Arial';
        ctx.fillText('EMERGENCY PROFILE', canvas.width / 2, 540);

        // Blood group if exists
        if (order.profile?.bloodType) {
          ctx.font = 'bold 28px Arial';
          ctx.fillStyle = '#dc2626';
          ctx.fillText(`🩸 ${order.profile.bloodType}`, canvas.width / 2, 580);
          ctx.fillStyle = order.textColor;
        }

        // Emergency contact
        if (order.profile?.contacts?.[0]) {
          const contact = order.profile.contacts[0];
          ctx.font = '18px Arial';
          ctx.fillText(`📞 Contacto: ${contact.name}`, canvas.width / 2, 620);
          ctx.fillText(
            `${contact.phone} (${contact.relation})`,
            canvas.width / 2,
            645
          );
        }

        // URL
        ctx.font = '16px Arial';
        ctx.fillText(qrUrl, canvas.width / 2, 680);

        // Serial
        ctx.font = '14px Arial';
        ctx.fillText(`Serial: ${order.serial}`, canvas.width / 2, 720);

        // SafeTap
        ctx.font = 'bold 20px Arial';
        ctx.fillText('SafeTap.es', canvas.width / 2, 760);

        // Download the image
        const link = document.createElement('a');
        link.download = `safetap-sticker-${order.serial}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      };
      qrImage.src = qrDataUrl;
    } catch (err) {
      console.error('Error al generar sticker:', err);
      alert('Error al generar el sticker');
    }
  };

  const downloadStickerHighRes = async (order: Order) => {
    try {
      // Get the QR URL using the shared utility function
      const qrUrl = await getQrUrlForSticker(order.id, order.slug);

      // Create canvas for the sticker
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Configure the canvas for the sticker (high-res print size)
      canvas.width = 1200;
      canvas.height = 1800;

      // Background of the sticker
      ctx.fillStyle = order.stickerColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = order.textColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Text of the sticker
      ctx.fillStyle = order.textColor;
      ctx.textAlign = 'center';

      // Name on sticker
      ctx.font = 'bold 64px Arial';
      ctx.fillText(order.nameOnSticker, canvas.width / 2, 120);

      // Flag (emoji)
      ctx.font = '96px Arial';
      ctx.fillText(order.flagCode, canvas.width / 2, 240);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 700,
        margin: 2,
        color: {
          dark: order.textColor,
          light: order.stickerColor,
        },
      });

      const qrImage = new Image();
      qrImage.onload = () => {
        // Draw QR
        ctx.drawImage(qrImage, 250, 300, 700, 700);

        // Text of emergency
        ctx.font = 'bold 48px Arial';
        ctx.fillText('EMERGENCY PROFILE', canvas.width / 2, 1080);

        // Blood group if exists
        if (order.profile?.bloodType) {
          ctx.font = 'bold 56px Arial';
          ctx.fillStyle = '#dc2626';
          ctx.fillText(`🩸 ${order.profile.bloodType}`, canvas.width / 2, 1160);
          ctx.fillStyle = order.textColor;
        }

        // Emergency contact
        if (order.profile?.contacts?.[0]) {
          const contact = order.profile.contacts[0];
          ctx.font = '24px Arial';
          ctx.fillText(`📞 Contacto: ${contact.name}`, canvas.width / 2, 1240);
          ctx.fillText(
            `${contact.phone} (${contact.relation})`,
            canvas.width / 2,
            1270
          );
        }

        // URL
        ctx.font = '20px Arial';
        ctx.fillText(qrUrl, canvas.width / 2, 1360);

        // Serial
        ctx.font = '18px Arial';
        ctx.fillText(`Serial: ${order.serial}`, canvas.width / 2, 1400);

        // SafeTap
        ctx.font = 'bold 32px Arial';
        ctx.fillText('SafeTap.es', canvas.width / 2, 1440);

        // Download the image
        const link = document.createElement('a');
        link.download = `safetap-sticker-${order.serial}-highres.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      };
      qrImage.src = qrDataUrl;
    } catch (err) {
      console.error('Error al generar sticker alta resolución:', err);
      alert('Error al generar el sticker en alta resolución');
    }
  };

  const viewStickerPreview = (order: Order) => {
    // Show the sticker preview modal
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

  // Bulk update selected orders to next status
  const bulkUpdateStatus = async () => {
    if (selectedOrders.size === 0) return;

    const selectedOrdersList = filteredOrders.filter((o) =>
      selectedOrders.has(o.id)
    );
    const promises = selectedOrdersList.map((order) => {
      const availableTransitions = getAvailableTransitions(
        order.status,
        order.payments
      );
      // Get the first available forward transition
      const nextTransition = availableTransitions.find(
        (t) => t.direction === 'forward'
      );
      if (nextTransition) {
        return updateOrderStatus(order.id, nextTransition.status);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    setSelectedOrders(new Set());
  };

  // Download selected orders as high-res stickers
  const downloadSelectedStickers = async () => {
    if (selectedOrders.size === 0) return;

    const selectedOrdersList = filteredOrders.filter((o) =>
      selectedOrders.has(o.id)
    );
    for (const order of selectedOrdersList) {
      await downloadStickerHighRes(order);
      // Add a small delay to prevent overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
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
      {/* Filters and Bulk Actions */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Status Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Order['status'] | 'ALL')
              }
              className="w-full sm:w-auto border rounded px-3 py-1 text-sm"
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

          {/* Country Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">País</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full sm:w-auto border rounded px-3 py-1 text-sm"
            >
              <option value="ALL">Todos</option>
              {countries.map((country) => (
                <option key={country || 'unknown'} value={country || 'unknown'}>
                  {country || 'Sin país'}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 sm:ml-auto">
            {filteredOrders.length} de {orders.length} órdenes
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center pt-2 border-t">
          {selectedOrders.size > 0 ? (
            <>
              <span className="text-sm font-medium">
                {selectedOrders.size} seleccionadas
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={bulkUpdateStatus}
                  disabled={selectedOrders.size === 0}
                  className="text-sm flex-1 sm:flex-none"
                >
                  Avanzar Estado
                </Button>
                <Button
                  onClick={downloadSelectedStickers}
                  disabled={selectedOrders.size === 0}
                  variant="outline"
                  className="text-sm flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={fixInconsistencies}
                disabled={fixingInconsistencies}
                variant="outline"
                className="text-sm flex-1 sm:flex-none"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                {fixingInconsistencies
                  ? 'Arreglando...'
                  : 'Arreglar Inconsistencias'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-2 font-medium">
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
                <th className="text-left p-2 font-medium">Usuario</th>
                <th className="text-left p-2 font-medium">Estado</th>
                <th className="text-left p-2 font-medium">País</th>
                <th className="text-left p-2 font-medium">Grupo Sang.</th>
                <th className="text-left p-2 font-medium">Contactos</th>
                <th className="text-left p-2 font-medium">Pago</th>
                <th className="text-left p-2 font-medium">Fecha</th>
                <th className="text-left p-2 font-medium">Acciones</th>
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
                const availableTransitions = getAvailableTransitions(
                  order.status,
                  order.payments
                );

                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium text-sm">
                          {order.owner.name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.owner.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(displayStatus.primaryStatus)}`}
                          >
                            {getStatusLabel(displayStatus.primaryStatus)}
                          </span>
                          {displayStatus.secondaryStatuses.length > 0 && (
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600`}
                            >
                              ▲{' '}
                              {getStatusLabel(
                                displayStatus.secondaryStatuses[0]
                              )}
                            </span>
                          )}
                          {!consistency.isConsistent && (
                            <div className="flex items-center space-x-1 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>Inconsistencia</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {availableTransitions.map((transition) => (
                            <Button
                              key={transition.status}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateOrderStatus(order.id, transition.status)
                              }
                              disabled={loadingStates[order.id]}
                              className="text-xs flex items-center space-x-1"
                              title={transition.description}
                            >
                              {transition.direction === 'backward' ? (
                                <ChevronLeft className="w-3 h-3" />
                              ) : transition.direction === 'special' ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <span>{getStatusLabel(transition.status)}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        {order.owner.country ? (
                          <span>{order.owner.country}</span>
                        ) : (
                          <span className="text-gray-400">Sin país</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        {order.profile?.bloodType ? (
                          <span className="text-red-600 font-medium">
                            🩸 {order.profile.bloodType}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        {order.profile?.contacts?.[0] ? (
                          <div>
                            <div>{order.profile.contacts[0].name}</div>
                            <div className="text-gray-500">
                              {order.profile.contacts[0].phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {paymentDisplay.amount}
                        </div>
                        <div
                          className={`text-xs ${paymentDisplay.statusColor}`}
                        >
                          {paymentDisplay.status}
                        </div>
                        {!consistency.isConsistent && (
                          <div className="text-xs text-red-600">
                            ⚠️ {consistency.issues[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewStickerPreview(order)}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Ir a la página de visualización del perfil en el backoffice
                            const profileUrl = `/dashboard/users/${order.owner.id}/profile`;
                            window.open(profileUrl, '_blank');
                          }}
                          className="text-xs"
                          title="Ver información de emergencia completa"
                        >
                          🔗
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQR(order)}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          QR
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
                          className="text-xs"
                          title="Editar usuario"
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `/dashboard/users/${order.owner.id}/edit-profile`,
                              '_blank'
                            );
                          }}
                          className="text-xs"
                          title="Editar perfil de emergencia"
                        >
                          👤
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

      {/* Orders Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {/* Mobile select all */}
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-lg border p-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={
                  selectedOrders.size === filteredOrders.length &&
                  filteredOrders.length > 0
                }
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span>Seleccionar todas las órdenes</span>
            </label>
          </div>
        )}

        {filteredOrders.map((order) => {
          const paymentInfo = analyzePayments(order.payments);
          // Use pre-processed display status if available, otherwise calculate it
          const displayStatus = order.displayStatus
            ? {
                primaryStatus: order.displayStatus as string,
                secondaryStatuses: order.displaySecondaryStatuses || [],
                description: order.displayDescription || '',
              }
            : getDisplayStatus(order.status, paymentInfo);
          const paymentDisplay = getPaymentDisplayInfo(paymentInfo);
          const consistency = checkOrderConsistency(order.status, paymentInfo);
          const availableTransitions = getAvailableTransitions(
            order.status,
            order.payments
          );

          return (
            <div
              key={order.id}
              className="bg-white rounded-lg border p-4 space-y-3"
            >
              {/* Header with checkbox and status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => toggleOrderSelection(order.id)}
                    className="rounded border-gray-300 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {order.owner.name || 'Sin nombre'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.owner.email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(displayStatus.primaryStatus)}`}
                  >
                    {getStatusLabel(displayStatus.primaryStatus as OrderStatus)}
                  </span>
                  {displayStatus.secondaryStatuses.length > 0 && (
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600`}
                    >
                      ▲{' '}
                      {getStatusLabel(
                        displayStatus.secondaryStatuses[0] as OrderStatus
                      )}
                    </span>
                  )}
                  {!consistency.isConsistent && (
                    <div className="flex items-center space-x-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span>Inconsistencia</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main info */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">País:</span>
                    <div>{order.owner.country || 'Sin país'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Grupo Sang.:</span>
                    <div>
                      {order.profile?.bloodType ? (
                        <span className="text-red-600 font-medium">
                          🩸 {order.profile.bloodType}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Pago:</span>
                    <div>
                      <div className="space-y-1">
                        <span className="font-medium">
                          {paymentDisplay.amount}
                        </span>
                        <div
                          className={`text-xs ${paymentDisplay.statusColor}`}
                        >
                          {paymentDisplay.status}
                        </div>
                        {!consistency.isConsistent && (
                          <div className="text-xs text-red-600">
                            ⚠️ {consistency.issues[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <div>{formatDateTime(order.createdAt)}</div>
                  </div>
                </div>

                {/* Contact info */}
                {order.profile?.contacts?.[0] && (
                  <div className="text-xs">
                    <span className="text-gray-500">Contacto:</span>
                    <div>{order.profile.contacts[0].name}</div>
                    <div className="text-gray-500">
                      {order.profile.contacts[0].phone}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((transition) => (
                    <Button
                      key={transition.status}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateOrderStatus(order.id, transition.status)
                      }
                      disabled={loadingStates[order.id]}
                      className="text-xs flex items-center space-x-1"
                    >
                      {transition.direction === 'backward' ? (
                        <ChevronLeft className="w-3 h-3" />
                      ) : transition.direction === 'special' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span>{getStatusLabel(transition.status)}</span>
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewStickerPreview(order)}
                    className="text-xs flex items-center justify-center"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Ir a la página de visualización del perfil en el backoffice
                      const profileUrl = `/dashboard/users/${order.owner.id}/profile`;
                      window.open(profileUrl, '_blank');
                    }}
                    className="text-xs flex items-center justify-center"
                    title="Ver información de emergencia completa"
                  >
                    🔗 Perfil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQR(order)}
                    className="text-xs flex items-center justify-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    QR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `/dashboard/users/${order.owner.id}/edit-profile`,
                        '_blank'
                      );
                    }}
                    className="text-xs flex items-center justify-center"
                    title="Editar perfil"
                  >
                    👤 Edit
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay órdenes registradas
        </div>
      )}

      {/* Sticker preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Vista previa del sticker
              </h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="flex justify-center">
              <div className="p-8">
                <StickerPreview sticker={showPreview} size={300} />
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Serial:</span>
                <span className="font-mono">{showPreview.serial}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(showPreview.status)}`}
                >
                  {getStatusLabel(showPreview.status)}
                </span>
              </div>
              {showPreview.profile?.bloodType && (
                <div className="flex justify-between">
                  <span>Tipo de sangre:</span>
                  <span className="text-red-600 font-medium">
                    🩸 {showPreview.profile.bloodType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
