'use client';

import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils';
import { Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useMemo, useState } from 'react';
import { Button } from './button';
import StickerPreview from './sticker-preview';

type Order = {
  id: string;
  slug: string;
  serial: string;
  nameOnSticker: string;
  flagCode: string;
  stickerColor: string;
  textColor: string;
  status: 'ORDERED' | 'PAID' | 'PRINTING' | 'SHIPPED' | 'ACTIVE' | 'LOST';
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
    country: string | null;
  };
  profile?: {
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes: string | null;
    contacts: {
      name: string;
      phone: string;
      relation: string;
    }[];
  } | null;
  payments: {
    amountCents: number;
    currency: string;
    createdAt: Date;
  }[];
};

interface OrdersTableProps {
  orders: Order[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, Order['status']>
  >({});
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'ALL'>(
    'ALL'
  );
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [showPreview, setShowPreview] = useState<Order | null>(null);

  // Helper function to get the main app URL
  const getMainAppUrl = () => {
    if (typeof window === 'undefined') return '';

    // In development, replace backoffice port (3002) with main app port (3000)
    // In production, both should be on the same domain or configured properly
    const currentOrigin = window.location.origin;

    if (currentOrigin.includes(':3002')) {
      return currentOrigin.replace(':3002', ':3000');
    }

    // In production, assume main app is on root domain
    return currentOrigin.replace('/backoffice', '');
  };

  // Apply optimistic updates to orders
  const ordersWithOptimisticUpdates = orders.map((order) => ({
    ...order,
    status: optimisticUpdates[order.id] || order.status,
  }));

  // Filter orders based on selected filters
  const filteredOrders = useMemo(() => {
    return ordersWithOptimisticUpdates.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (countryFilter !== 'ALL' && order.owner.country !== countryFilter)
        return false;
      return true;
    });
  }, [ordersWithOptimisticUpdates, statusFilter, countryFilter]);

  // Get unique countries for filter
  const countries = Array.from(
    new Set(orders.map((o) => o.owner.country).filter(Boolean))
  );

  const getNextStatus = (
    currentStatus: Order['status']
  ): Order['status'] | null => {
    // Flujo lógico de transiciones (solo hacia adelante, excepto LOST)
    const flow: Record<string, Order['status']> = {
      ORDERED: 'PAID',
      PAID: 'PRINTING',
      PRINTING: 'SHIPPED',
      SHIPPED: 'ACTIVE',
    };

    return flow[currentStatus] || null;
  };

  const getPossibleTransitions = (
    currentStatus: Order['status']
  ): Order['status'][] => {
    // Definir todas las transiciones posibles para cada estado
    const transitions: Record<string, Order['status'][]> = {
      ORDERED: ['PAID', 'LOST'], // Puede marcar como pagada o perdida
      PAID: ['PRINTING', 'LOST'], // Puede enviar a imprimir o marcar perdida
      PRINTING: ['SHIPPED', 'LOST'], // Puede enviar o marcar perdida
      SHIPPED: ['ACTIVE', 'LOST'], // Puede activar o marcar perdida
      ACTIVE: ['LOST'], // Solo puede marcar como perdida
      LOST: [], // Estado final, no puede cambiar
    };

    return transitions[currentStatus] || [];
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      ORDERED: 'Creada',
      PAID: 'Pagada',
      PRINTING: 'Imprimiendo',
      SHIPPED: 'Enviada',
      ACTIVE: 'Activa',
      LOST: 'Perdida',
    };
    return labels[status];
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order['status']
  ) => {
    setLoadingStates((prev) => ({ ...prev, [orderId]: true }));

    // Optimistic update: immediately update the UI
    setOptimisticUpdates((prev) => ({ ...prev, [orderId]: newStatus }));

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Revert optimistic update on error
        setOptimisticUpdates((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });

        throw new Error(
          `Error ${response.status}: ${errorData.error || 'Error al actualizar el estado de la orden'}`
        );
      }

      // Clear optimistic update and refresh from server
      setOptimisticUpdates((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });

      // Use Next.js router refresh to get fresh data from server
      router.refresh();
    } catch (error) {
      alert(
        `Error al actualizar el estado de la orden: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const downloadQR = async (order: Order) => {
    try {
      // Create URL for the QR
      const qrUrl = `${getMainAppUrl()}/s/${order.slug}`;

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
    } catch (error) {
      alert('Error al generar el sticker');
    }
  };

  const downloadStickerHighRes = async (order: Order) => {
    try {
      // Create URL for the QR
      const qrUrl = `${getMainAppUrl()}/s/${order.slug}`;

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
    } catch (error) {
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

  // Bulk update selected orders to next status (only orders that have a linear next step)
  const bulkUpdateStatus = async () => {
    if (selectedOrders.size === 0) return;

    const selectedOrdersList = filteredOrders.filter((o) =>
      selectedOrders.has(o.id)
    );

    // Solo actualizar ordenes que tienen un siguiente estado claro (no LOST)
    const ordersToUpdate = selectedOrdersList.filter((order) => {
      const nextStatus = getNextStatus(order.status);
      return nextStatus !== null;
    });

    if (ordersToUpdate.length === 0) {
      alert(
        'Las órdenes seleccionadas no pueden avanzar automáticamente al siguiente estado'
      );
      return;
    }

    const promises = ordersToUpdate.map((order) => {
      const nextStatus = getNextStatus(order.status);
      if (nextStatus) {
        return updateOrderStatus(order.id, nextStatus);
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

  return (
    <div className="space-y-4 max-w-full mx-auto">
      {/* Filters and Bulk Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Order['status'] | 'ALL')
              }
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="ORDERED">Creada</option>
              <option value="PAID">Pagada</option>
              <option value="PRINTING">Imprimiendo</option>
              <option value="SHIPPED">Enviada</option>
              <option value="ACTIVE">Activa</option>
              <option value="LOST">Perdida</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">País</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
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
          <div className="text-sm text-gray-600">
            {filteredOrders.length} de {orders.length} órdenes
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">
              {selectedOrders.size} seleccionadas
            </span>
            <Button
              onClick={bulkUpdateStatus}
              disabled={selectedOrders.size === 0}
              className="text-sm"
            >
              Avanzar Estado
            </Button>
            <Button
              onClick={downloadSelectedStickers}
              disabled={selectedOrders.size === 0}
              variant="outline"
              className="text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </Button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-center p-4">
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
                <th className="text-center p-4 font-medium">Sticker</th>
                <th className="text-center p-4 font-medium">Usuario</th>
                <th className="text-center p-4 font-medium">Estado</th>
                <th className="text-center p-4 font-medium">País</th>
                <th className="text-center p-4 font-medium">Grupo Sang.</th>
                <th className="text-center p-4 font-medium">Contactos</th>
                <th className="text-center p-4 font-medium">Pago</th>
                <th className="text-center p-4 font-medium">Fecha</th>
                <th className="text-center p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const totalPaid = order.payments.reduce(
                  (sum, p) => sum + p.amountCents,
                  0
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
                      <div className="flex justify-center">
                        <StickerPreview sticker={order} size={120} />
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-sm">
                          {order.owner.name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.owner.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>

                        {/* Dropdown para transiciones posibles */}
                        {getPossibleTransitions(order.status).length > 0 && (
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateOrderStatus(
                                    order.id,
                                    e.target.value as Order['status']
                                  );
                                  e.target.value = ''; // Reset dropdown
                                }
                              }}
                              disabled={loadingStates[order.id]}
                              className="text-xs border rounded px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <option value="">Cambiar a...</option>
                              {getPossibleTransitions(order.status).map(
                                (status) => (
                                  <option key={status} value={status}>
                                    {getStatusLabel(status)}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        {order.owner.country ? (
                          <span>{order.owner.country}</span>
                        ) : (
                          <span className="text-gray-400">Sin país</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
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
                    <td className="p-4">
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
                    <td className="p-4">
                      {totalPaid > 0 ? (
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(
                            totalPaid,
                            order.payments[0]?.currency || 'EUR'
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin pago</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
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
                            // Navigate to user details page in backoffice
                            router.push(`/dashboard/users/${order.owner.id}`);
                          }}
                          className="text-xs"
                          title="Ver información del usuario"
                        >
                          Perfil
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay órdenes registradas
        </div>
      )}

      {/* Sticker preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowPreview(null)}
        >
          <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Vista previa del sticker</h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="flex justify-center">
              <StickerPreview sticker={showPreview} size={400} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
