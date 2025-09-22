'use client';

import { Button } from '@/components/ui/button';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/order-helpers';
import { Order } from '@/types/dashboard';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Edit,
  Eye,
  Hash,
  List,
  MapPin,
  Package,
  Phone,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import StickerPreview from '../../../components/StickerPreview';

/**
 * Format date
 * @param date - The date
 * @returns - The formatted date
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface OrdersManagementProps {
  orders: Order[];
}

export default function OrdersManagement({ orders }: OrdersManagementProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'user' | 'purchase'>(
    'list'
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /**
   * Read view mode from URL parameters on component mount
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedView = urlParams.get('view') as 'list' | 'user' | 'purchase';
    if (savedView && ['list', 'user', 'purchase'].includes(savedView)) {
      setViewMode(savedView);
    }
  }, []);

  /**
   * Toggle group expansion
   * @param groupKey - The group key
   */
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  /**
   * Handle bulk actions for a group
   * @param group - The group
   * @param action - The action
   */
  const handleGroupAction = async (
    group: {
      orders: Order[];
    },
    action: string
  ) => {
    if (group.orders.length === 0) return;

    console.warn('handleGroupAction called:', {
      action,
      orderCount: group.orders.length,
      orderIds: group.orders.map((o) => o.id.slice(0, 8) + '...'),
      hasGroupId: group.orders[0]?.groupId ? true : false,
      groupId: group.orders[0]?.groupId?.slice(0, 8) + '...',
    });

    try {
      const orderIds = group.orders.map((order) => order.id);

      console.warn('Making bulk update request:', {
        endpoint: '/api/admin/orders/bulk-update',
        orderIds: orderIds.slice(0, 3).map((id) => id.slice(0, 8) + '...'),
        status: action,
        totalOrders: orderIds.length,
      });

      const response = await fetch('/api/admin/orders/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds,
          status: action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          'Bulk update failed with status:',
          response.status,
          errorData
        );
        throw new Error(
          errorData.error || 'Error al actualizar los estados en lote'
        );
      }

      const responseData = await response.json();
      console.warn('Bulk update successful:', {
        updatedCount: responseData.updatedCount,
        originalRequestCount: responseData.originalRequestCount,
        finalUpdateCount: responseData.finalUpdateCount,
        groupsAffected: responseData.groupsAffected,
      });

      /**
       * Instead of full reload, preserve the current view mode
       */
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('view', viewMode);
      window.location.href = currentUrl.toString();
    } catch (error) {
      console.error('Error al actualizar stickers en lote:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al actualizar los stickers: ${errorMessage}`);
    }
  };

  /**
   * Group orders by groupId (much simpler and more reliable!)
   */
  const groupedOrders =
    viewMode !== 'list'
      ? orders.reduce(
          (acc, order) => {
            let groupKey: string;

            if (viewMode === 'purchase') {
              groupKey =
                order.groupId ||
                `fallback_${order.owner.email}_${order.createdAt.toDateString()}`;
            } else {
              groupKey = `user_${order.owner.email}`;
            }

            if (!acc[groupKey]) {
              acc[groupKey] = {
                user: order.owner,
                orders: [],
                paymentRef: order.payments[0]?.reference,
                purchaseDate: order.createdAt,
                groupId: order.groupId,
              };
            }
            acc[groupKey].orders.push(order);
            return acc;
          },
          {} as Record<
            string,
            {
              user: Order['owner'];
              orders: Order[];
              paymentRef?: string;
              purchaseDate: Date;
              groupId?: string | null;
            }
          >
        )
      : null;

  const handleStatusTransition = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error('Orden no encontrada');
      }

      if (order.groupId) {
        const groupOrders = orders.filter((o) => o.groupId === order.groupId);
        const orderIds = groupOrders.map((o) => o.id);

        console.warn(
          `Actualizando batch order (grupo ${order.groupId.slice(0, 8)}...) con ${orderIds.length} stickers:`,
          orderIds.slice(0, 3).map((id) => id.slice(0, 8) + '...')
        );

        const response = await fetch('/api/admin/orders/bulk-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderIds,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Error al actualizar los estados en lote'
          );
        }

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('view', viewMode);
        window.location.href = currentUrl.toString();
        return;
      }

      console.warn(`Actualizando single order: ${orderId.slice(0, 8)}...`);

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado');
      }

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('view', viewMode);
      window.location.href = currentUrl.toString();
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al actualizar el estado de la orden: ${errorMessage}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPreview(true);
  };

  const editUser = (userId: string) => {
    window.open(`/dashboard/users?user=${userId}`, '_blank');
  };

  const handleDownloadSVG = async (order: Order) => {
    try {
      const stickerElement = document.querySelector(
        '[data-testid="sticker-preview"]'
      ) as HTMLElement;
      if (!stickerElement) {
        alert('No se pudo encontrar el sticker para descargar');
        return;
      }

      const images = stickerElement.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(undefined);
            img.onerror = () => resolve(undefined);
          });
        })
      );

      const htmlToImage = await import('html-to-image');

      const svgDataUrl = await htmlToImage.toSvg(stickerElement, {
        width: stickerElement.offsetWidth * 8,
        height: stickerElement.offsetHeight * 8,
        style: {
          transform: 'scale(8)',
          transformOrigin: 'top left',
        },
        pixelRatio: 2,
        quality: 1,
        backgroundColor: 'transparent',
        filter: (_node) => {
          return true;
        },
      });

      const link = document.createElement('a');
      link.href = svgDataUrl;
      link.download = `sticker-${order.id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generando SVG:', error);
      alert('Error al generar el archivo SVG');
    }
  };

  const handleDownloadPNG = async (order: Order) => {
    try {
      const stickerElement = document.querySelector(
        '[data-testid="sticker-preview"]'
      ) as HTMLElement;
      if (!stickerElement) {
        alert('No se pudo encontrar el sticker para descargar');
        return;
      }

      const images = stickerElement.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(undefined);
            img.onerror = () => resolve(undefined);
          });
        })
      );

      const htmlToImage = await import('html-to-image');

      const dataUrl = await htmlToImage.toPng(stickerElement, {
        width: stickerElement.offsetWidth * 10,
        height: stickerElement.offsetHeight * 10,
        style: {
          transform: 'scale(10)',
          transformOrigin: 'top left',
        },
        pixelRatio: 4,
        quality: 1,
        backgroundColor: 'transparent',
        canvasWidth: stickerElement.offsetWidth * 10,
        canvasHeight: stickerElement.offsetHeight * 10,
        filter: (_node) => {
          return true;
        },
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      downloadFile(blob, `sticker-${order.id}.png`, 'image/png');
    } catch (error) {
      console.error('Error generando PNG:', error);
      alert('Error al generar el archivo PNG');
    }
  };

  const downloadFile = (
    content: string | Blob,
    filename: string,
    mimeType: string
  ) => {
    const blob =
      typeof content === 'string'
        ? new Blob([content], { type: mimeType })
        : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style jsx>{`
        .bg-blue-25 {
          background-color: #f8faff;
        }
        .bg-indigo-25 {
          background-color: #faf9ff;
        }
        .bg-gray-25 {
          background-color: #fafafa;
        }
        @keyframes subtle-glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          }
        }
        .animate-glow {
          animation: subtle-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-6">
        {' '}
        {/* View Toggle */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex gap-3">
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
            >
              <List className="w-4 h-4 mr-2" />
              Vista Lista
            </Button>
            <Button
              onClick={() => setViewMode('user')}
              variant={viewMode === 'user' ? 'default' : 'outline'}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
            >
              <Users className="w-4 h-4 mr-2" />
              Agrupar por Usuario
            </Button>
            <Button
              onClick={() => setViewMode('purchase')}
              variant={viewMode === 'purchase' ? 'default' : 'outline'}
              size="sm"
              className="transition-all duration-200 hover:scale-105"
            >
              <Package className="w-4 h-4 mr-2" />
              Agrupar por Compra
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-700">
              {orders.length} órdenes totales
            </div>
            {viewMode !== 'list' && groupedOrders && (
              <div className="text-sm font-medium text-blue-600">
                {Object.keys(groupedOrders).length} grupo
                {Object.keys(groupedOrders).length !== 1 ? 's' : ''}
              </div>
            )}
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        {/* Orders Display */}
        <div className="space-y-4">
          {viewMode !== 'list' && groupedOrders
            ? /* Grouped View - Card-based with Expandable Transaction Groups */
              Object.entries(groupedOrders).map(([groupKey, group]) => {
                const isExpanded = expandedGroups.has(groupKey);

                let totalAmount = 0;
                let totalOriginalAmount = 0;
                let totalDiscountAmount = 0;

                if (viewMode === 'purchase' && group.groupId) {
                  // For batch orders (grouped by purchase), use only ONE payment for the entire group
                  // Find the payment from any order in the group that has amount > 0
                  const batchPayment = group.orders
                    .map((order) => order.payments[0])
                    .find((payment) => payment && payment.amount > 0);

                  if (batchPayment) {
                    totalAmount = batchPayment.amount;
                    totalOriginalAmount =
                      batchPayment.originalAmount || batchPayment.amount;
                    totalDiscountAmount = batchPayment.discountAmount || 0;
                  }
                } else {
                  // For individual orders or user grouping, sum all valid payments
                  const validPayments = group.orders
                    .map((order) => order.payments[0])
                    .filter((payment) => payment && payment.amount > 0);

                  totalAmount = validPayments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                  );
                  totalOriginalAmount = validPayments.reduce(
                    (sum, payment) =>
                      sum + (payment.originalAmount || payment.amount),
                    0
                  );
                  totalDiscountAmount = validPayments.reduce(
                    (sum, payment) => sum + (payment.discountAmount || 0),
                    0
                  );
                }

                const hasDiscount =
                  totalDiscountAmount > 0 && totalOriginalAmount > totalAmount;

                return (
                  <div
                    key={groupKey}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl"
                  >
                    {/* Transaction/Group Header - Clickable to expand/collapse */}
                    <div
                      className={`${viewMode === 'purchase' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-400'} p-6 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-all duration-200`}
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Expand/Collapse Icon */}
                          <div className="flex items-center">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-indigo-600 transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-indigo-600 transition-transform duration-200" />
                            )}
                          </div>

                          {/* User Avatar and Info */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 ${viewMode === 'purchase' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}
                            >
                              {(group.user.name || group.user.email)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">
                                {group.user.name || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {group.user.email}
                              </div>
                              {viewMode === 'purchase' && group.groupId && (
                                <div className="text-xs font-mono text-green-700 bg-green-100 px-2 py-1 rounded mt-1">
                                  🏷️ Grupo: {group.groupId.slice(-8)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Transaction Info Badges */}
                          <div className="flex items-center gap-3">
                            <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  {group.user.country}
                                </span>
                              </div>
                            </div>

                            {/* Payment reference or purchase date */}
                            {group.paymentRef ? (
                              <div className="bg-blue-500 text-white px-3 py-2 rounded-lg font-mono text-sm shadow-md">
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4" />
                                  {group.paymentRef}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded-lg text-sm font-medium shadow-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {group.purchaseDate.toLocaleDateString(
                                    'es-ES'
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Contact info for this user */}
                            {group.orders[0]?.profile?.contacts &&
                              group.orders[0].profile.contacts.length > 0 && (
                                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {group.orders[0].profile.contacts[0].name}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Summary Info and Actions */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div
                              className={`${viewMode === 'purchase' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md`}
                            >
                              <Package className="w-4 h-4 inline mr-1" />
                              {group.orders.length} sticker
                              {group.orders.length !== 1 ? 's' : ''}
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md mt-2">
                              <CreditCard className="w-4 h-4 inline mr-1" />
                              {formatCurrency(
                                totalAmount,
                                group.orders[0]?.payments[0]?.currency || 'CLP'
                              )}
                            </div>
                            {/* Show discount info if available */}
                            {hasDiscount && (
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm mt-1">
                                🎉 Descuento: -
                                {formatCurrency(
                                  totalDiscountAmount,
                                  group.orders[0]?.payments[0]?.currency ||
                                    'CLP'
                                )}
                                {/* Show promotion name if available */}
                                {group.orders[0]?.payments[0]?.promotion && (
                                  <div className="text-green-700 text-xs mt-1">
                                    🏷️{' '}
                                    {group.orders[0].payments[0].promotion.name}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Group Actions - Smart next step actions */}
                          <div className="flex flex-col gap-2">
                            {/* Determine the most common next action based on current states */}
                            {(() => {
                              const statuses = group.orders.map(
                                (order) => order.displayStatus || order.status
                              );

                              // Count orders in each state
                              const statusCounts = {
                                [ORDER_STATUS.ORDERED]: statuses.filter(
                                  (s) => s === ORDER_STATUS.ORDERED
                                ).length,
                                [ORDER_STATUS.PAID]: statuses.filter(
                                  (s) => s === ORDER_STATUS.PAID
                                ).length,
                                [ORDER_STATUS.PRINTING]: statuses.filter(
                                  (s) => s === ORDER_STATUS.PRINTING
                                ).length,
                                [ORDER_STATUS.SHIPPED]: statuses.filter(
                                  (s) => s === ORDER_STATUS.SHIPPED
                                ).length,
                                [ORDER_STATUS.ACTIVE]: statuses.filter(
                                  (s) => s === ORDER_STATUS.ACTIVE
                                ).length,
                              };

                              // Find the most common state
                              const mostCommonStateEntry = Object.entries(
                                statusCounts
                              ).reduce(
                                (max, [state, count]) =>
                                  count > max[1] ? [state, count] : max,
                                [ORDER_STATUS.ORDERED, 0]
                              );
                              const mostCommonState = mostCommonStateEntry[0];

                              // Check if all stickers in the group have valid payments
                              // Since we now associate the same payment to all stickers in a batch,
                              // this should be consistent across the group
                              const anyHaveValidPayments = group.orders.some(
                                (order) => hasValidPayment(order.payments)
                              );

                              return (
                                <>
                                  {/* Show next logical action based on most common state */}
                                  {mostCommonState === ORDER_STATUS.ORDERED && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className={`font-medium ${
                                        !anyHaveValidPayments
                                          ? 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                          : 'text-green-600 border-green-200 hover:bg-green-50'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (anyHaveValidPayments) {
                                          handleGroupAction(
                                            group,
                                            ORDER_STATUS.PAID
                                          );
                                        }
                                      }}
                                      disabled={!anyHaveValidPayments}
                                      title={
                                        !anyHaveValidPayments
                                          ? 'No se puede marcar como pagadas: ninguna orden tiene pagos válidos'
                                          : 'Marcar todas como pagadas'
                                      }
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />✅
                                      Marcar Pagadas
                                    </Button>
                                  )}

                                  {mostCommonState === ORDER_STATUS.PAID && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-purple-600 border-purple-200 hover:bg-purple-50 font-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGroupAction(
                                          group,
                                          ORDER_STATUS.PRINTING
                                        );
                                      }}
                                    >
                                      <Package className="w-4 h-4 mr-1" />
                                      🖨️ Imprimir Todas
                                    </Button>
                                  )}

                                  {mostCommonState ===
                                    ORDER_STATUS.PRINTING && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGroupAction(
                                          group,
                                          ORDER_STATUS.SHIPPED
                                        );
                                      }}
                                    >
                                      <Truck className="w-4 h-4 mr-1" />
                                      🚚 Enviar Todas
                                    </Button>
                                  )}

                                  {mostCommonState === ORDER_STATUS.SHIPPED && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-200 hover:bg-green-50 font-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGroupAction(
                                          group,
                                          ORDER_STATUS.ACTIVE
                                        );
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      🎯 Activar Todas
                                    </Button>
                                  )}

                                  {/* Always show reject option */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGroupAction(
                                        group,
                                        ORDER_STATUS.REJECTED
                                      );
                                    }}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />❌
                                    Rechazar
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Orders List */}
                    {isExpanded && (
                      <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="grid gap-4">
                          {group.orders.map((order) => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              orders={orders}
                              onViewOrder={handleViewOrder}
                              onEditUser={editUser}
                              onStatusTransition={handleStatusTransition}
                              isUpdating={isUpdating}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            : /* Individual Orders View - Card-based */
              orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  orders={orders}
                  onViewOrder={handleViewOrder}
                  onEditUser={editUser}
                  onStatusTransition={handleStatusTransition}
                  isUpdating={isUpdating}
                  standalone
                />
              ))}
        </div>
        {/* Modal preview */}
        {showPreview && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Vista previa del sticker
                </h3>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cerrar
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Información del cliente
                    </h4>
                    <p>
                      <strong>Nombre:</strong> {selectedOrder.owner.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.owner.email}
                    </p>
                    <p>
                      <strong>País:</strong> {selectedOrder.owner.country}
                    </p>
                    {selectedOrder.payments.length > 0 &&
                      selectedOrder.payments[0].reference && (
                        <p>
                          <strong>Referencia:</strong>
                          <span className="font-mono text-sm text-blue-600 ml-1">
                            {selectedOrder.payments[0].reference}
                          </span>
                        </p>
                      )}
                    {/* Payment and discount info */}
                    {selectedOrder.payments.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <h5 className="font-medium mb-2">
                          Información del pago
                        </h5>
                        <p>
                          <strong>Monto final:</strong>{' '}
                          {formatCurrency(
                            selectedOrder.payments[0].amount,
                            selectedOrder.payments[0].currency
                          )}
                        </p>
                        {selectedOrder.payments[0].originalAmount &&
                          selectedOrder.payments[0].discountAmount &&
                          selectedOrder.payments[0].originalAmount >
                            selectedOrder.payments[0].amount && (
                            <>
                              <p className="text-gray-500">
                                <strong>Monto original:</strong>{' '}
                                {formatCurrency(
                                  selectedOrder.payments[0].originalAmount,
                                  selectedOrder.payments[0].currency
                                )}
                              </p>
                              <p className="text-green-600 font-medium">
                                <strong>🎉 Descuento aplicado:</strong> -
                                {formatCurrency(
                                  selectedOrder.payments[0].discountAmount,
                                  selectedOrder.payments[0].currency
                                )}
                                {selectedOrder.payments[0].promotion && (
                                  <span className="block text-sm text-green-700 font-normal mt-1">
                                    🏷️ Promoción:{' '}
                                    {selectedOrder.payments[0].promotion.name}
                                    {selectedOrder.payments[0].promotion
                                      .description &&
                                      ` - ${selectedOrder.payments[0].promotion.description}`}
                                  </span>
                                )}
                              </p>
                            </>
                          )}
                        <p>
                          <strong>Estado:</strong>{' '}
                          {getPaymentStatus(selectedOrder.payments)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Detalles del sticker</h4>
                    <p>
                      <strong>Nombre en sticker:</strong>{' '}
                      {selectedOrder.nameOnSticker}
                    </p>
                    <p>
                      <strong>Bandera:</strong> {selectedOrder.flagCode}
                    </p>
                    <p>
                      <strong>Estado:</strong>{' '}
                      {getStatusLabel(
                        selectedOrder.displayStatus || selectedOrder.status
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Vista previa del sticker</h4>
                  <div
                    className="flex justify-center mb-4"
                    id="sticker-preview-for-download"
                  >
                    <StickerPreview
                      name={selectedOrder.nameOnSticker}
                      flagCode={selectedOrder.flagCode}
                      stickerColor={selectedOrder.stickerColor}
                      textColor={selectedOrder.textColor}
                      stickerId={selectedOrder.id}
                      serial={selectedOrder.serial}
                      showRealQR={true}
                    />
                  </div>

                  <h4 className="font-medium mb-2">Acciones disponibles</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownloadSVG(selectedOrder)}
                    >
                      Descargar SVG
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPNG(selectedOrder)}
                    >
                      Descargar PNG
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function getStatusColor(status: string): string {
  const colors = {
    ORDERED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PRINTING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    ACTIVE: 'bg-gray-100 text-gray-800',
    LOST: 'bg-red-100 text-red-800',
    REJECTED: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
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
  return labels[status as keyof typeof labels] || status;
}

function getPaymentStatus(payments: { status: string }[]): string {
  if (!payments || payments.length === 0) return 'Sin pagos';

  const hasPaid = payments.some(
    (p) =>
      p.status === PAYMENT_STATUS.PAID || p.status === PAYMENT_STATUS.VERIFIED
  );
  const hasPending = payments.some((p) => p.status === PAYMENT_STATUS.PENDING);

  if (hasPaid) return 'Pagado';
  if (hasPending) return 'Pendiente';
  return 'Sin pagos';
}

function hasValidPayment(
  payments: { status: string; amount: number }[]
): boolean {
  if (!payments || payments.length === 0) return false;

  return payments.some(
    (p) =>
      p.amount > 0 &&
      (p.status === PAYMENT_STATUS.PAID ||
        p.status === PAYMENT_STATUS.VERIFIED ||
        p.status === PAYMENT_STATUS.PENDING)
  );
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

interface OrderCardProps {
  order: Order;
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onEditUser: (userId: string) => void;
  onStatusTransition: (orderId: string, status: string) => Promise<void>;
  isUpdating: string | null;
  standalone?: boolean;
}

function OrderCard({
  order,
  orders,
  onViewOrder,
  onEditUser,
  onStatusTransition,
  isUpdating,
  standalone = false,
}: OrderCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case ORDER_STATUS.ORDERED:
        return <Clock className="w-4 h-4" />;
      case ORDER_STATUS.PAID:
        return <CheckCircle className="w-4 h-4" />;
      case ORDER_STATUS.PRINTING:
        return <Package className="w-4 h-4" />;
      case ORDER_STATUS.SHIPPED:
        return <Truck className="w-4 h-4" />;
      case ORDER_STATUS.ACTIVE:
        return <CheckCircle className="w-4 h-4" />;
      case ORDER_STATUS.LOST:
        return <XCircle className="w-4 h-4" />;
      case ORDER_STATUS.REJECTED:
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  /**
   * Check if the order is a batch order
   */
  const isBatchOrder = !!order.groupId;
  const hasPayment = hasValidPayment(order.payments);

  return (
    <div
      className={`${
        standalone
          ? isBatchOrder
            ? 'bg-white shadow-lg border-2 border-blue-300 border-l-4 border-l-blue-500'
            : 'bg-white shadow-lg border border-gray-200'
          : 'bg-white border border-gray-100'
      } rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Order Info & User */}
        <div className="md:col-span-3">
          {standalone && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {(order.owner.name || order.owner.email)
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {order.owner.name || 'Sin nombre'}
                </div>
                <div className="text-xs text-gray-600">{order.owner.email}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{order.id.slice(-8)}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {order.nameOnSticker}
            </div>
            <div className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-1.5 rounded-lg shadow-sm border border-purple-200">
              🏷️ {order.serial}
            </div>
            {isBatchOrder && (
              <div className="text-xs font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                � Batch Order (groupId: {order.groupId?.slice(-8)})
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${getStatusColor(order.displayStatus || order.status)}`}
            >
              {getStatusIcon(order.displayStatus || order.status)}
              {getStatusLabel(order.displayStatus || order.status)}
            </span>
          </div>
        </div>

        {/* Country & Sticker Info */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{order.flagCode}</span>
              <div
                className="w-5 h-5 rounded border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: order.stickerColor }}
                title={`Color: ${order.stickerColor}`}
              ></div>
            </div>
            {standalone && (
              <div className="text-sm text-gray-600">{order.owner.country}</div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="md:col-span-2">
          <div className="space-y-1">
            <div className="font-semibold text-gray-900 text-sm">
              {order.payments.length > 0
                ? formatCurrency(
                    order.payments[0].amount,
                    order.payments[0].currency
                  )
                : '💸 Sin pago'}
            </div>
            {/* Show discount info if available */}
            {order.payments.length > 0 &&
              order.payments[0].originalAmount &&
              order.payments[0].discountAmount &&
              order.payments[0].originalAmount > order.payments[0].amount && (
                <div className="text-xs space-y-1">
                  <div className="text-gray-500 line-through">
                    Original:{' '}
                    {formatCurrency(
                      order.payments[0].originalAmount,
                      order.payments[0].currency
                    )}
                  </div>
                  <div className="text-green-600 font-medium">
                    🎉 Descuento: -
                    {formatCurrency(
                      order.payments[0].discountAmount,
                      order.payments[0].currency
                    )}
                    {/* Show promotion name if available */}
                    {order.payments[0].promotion && (
                      <div className="text-green-700 text-xs font-normal mt-1">
                        🏷️ {order.payments[0].promotion.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            {order.payments.length > 0 && order.payments[0].reference && (
              <div className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                🧾 {order.payments[0].reference}
              </div>
            )}
            <div className="text-xs text-gray-500">
              {getPaymentStatus(order.payments)}
            </div>
          </div>
        </div>

        {/* Date & Contact */}
        <div className="md:col-span-2">
          <div className="space-y-2">
            <div className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.createdAt)}
            </div>
            {standalone &&
              order.profile?.contacts &&
              order.profile.contacts.length > 0 && (
                <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.profile.contacts[0].name}
                </div>
              )}
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-1">
          <div className="flex flex-col gap-2">
            {/* Quick Actions */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewOrder(order)}
                className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                title="Ver detalles del sticker"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditUser(order.owner.id)}
                className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                title="Editar usuario"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>

            {/* Status Actions */}
            <div className="flex flex-col gap-1">
              {order.displayStatus === ORDER_STATUS.ORDERED && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs py-1 ${
                      !hasPayment
                        ? 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                        : 'text-green-600 border-green-200 hover:bg-green-50'
                    }`}
                    onClick={() =>
                      hasPayment &&
                      onStatusTransition(order.id, ORDER_STATUS.PAID)
                    }
                    disabled={isUpdating === order.id || !hasPayment}
                    title={
                      !hasPayment
                        ? isBatchOrder
                          ? `No se puede marcar como pagadas sin un pago válido para el lote de ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers`
                          : 'No se puede marcar como pagada sin un pago válido'
                        : isBatchOrder
                          ? `Marcar como pagadas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                          : 'Marcar como pagada'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '✓ Pagadas (batch)'
                        : '✓ Pagada'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.REJECTED)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Rechazar todas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Rechazar'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '✗ Rechazar (batch)'
                        : '✗ Rechazar'}
                  </Button>
                </>
              )}

              {order.displayStatus === ORDER_STATUS.PAID && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.PRINTING)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Imprimir todas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Imprimir'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '🖨️ Imprimir (batch)'
                        : '🖨️ Imprimir'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.ORDERED)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Volver a creadas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Volver a creada'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '← Creadas (batch)'
                        : '← Creada'}
                  </Button>
                </>
              )}

              {order.displayStatus === ORDER_STATUS.PRINTING && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.SHIPPED)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Enviar todas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Enviar'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '🚚 Enviar (batch)'
                        : '🚚 Enviar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.PAID)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Volver a pagadas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Volver a pagada'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '← Pagadas (batch)'
                        : '← Pagada'}
                  </Button>
                </>
              )}

              {order.displayStatus === ORDER_STATUS.SHIPPED && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.ACTIVE)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Activar todas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Activar'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '✅ Activar (batch)'
                        : '✅ Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.PRINTING)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Volver a imprimiendo (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Volver a imprimiendo'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '← Imprimiendo (batch)'
                        : '← Imprimiendo'}
                  </Button>
                </>
              )}

              {order.displayStatus === ORDER_STATUS.ACTIVE && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.LOST)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Marcar como perdidas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Marcar como perdida'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '❌ Perdidas (batch)'
                        : '❌ Perdida'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-1"
                    onClick={() =>
                      onStatusTransition(order.id, ORDER_STATUS.SHIPPED)
                    }
                    disabled={isUpdating === order.id}
                    title={
                      isBatchOrder
                        ? `Volver a enviadas (lote completo - ${orders.filter((o: Order) => o.groupId === order.groupId).length} stickers)`
                        : 'Volver a enviada'
                    }
                  >
                    {isUpdating === order.id
                      ? '...'
                      : isBatchOrder
                        ? '← Enviadas (batch)'
                        : '← Enviada'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
