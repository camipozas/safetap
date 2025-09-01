'use client';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Order } from '@/types/dashboard';
import { Download, Edit, Eye } from 'lucide-react';
import { useState } from 'react';

interface OrdersManagementProps {
  orders: Order[];
}

export default function OrdersManagement({ orders }: OrdersManagementProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleStatusTransition = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
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
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowPreview(true);
  };

  const handleEditOrder = (order: Order) => {
    // Implementar edición de orden
    console.log('Editando orden:', order.id);
    // Aquí puedes abrir un modal o redirigir a una página de edición
  };

  const handleDownloadSVG = async (order: Order) => {
    try {
      // Generar SVG del sticker
      const svgContent = generateStickerSVG(order);
      downloadFile(svgContent, `sticker-${order.id}.svg`, 'image/svg+xml');
    } catch (error) {
      console.error('Error generando SVG:', error);
      alert('Error al generar el archivo SVG');
    }
  };

  const handleDownloadPNG = async (order: Order) => {
    try {
      // Generar PNG del sticker
      const pngBlob = await generateStickerPNG(order);
      downloadFile(pngBlob, `sticker-${order.id}.png`, 'image/png');
    } catch (error) {
      console.error('Error generando PNG:', error);
      alert('Error al generar el archivo PNG');
    }
  };

  const generateStickerSVG = (order: Order): string => {
    const {
      nameOnSticker,
      flagCode,
      stickerColor = '#f1f5f9',
      textColor = '#000000',
    } = order;

    return `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="200" fill="${stickerColor}" rx="10"/>
        <text x="150" y="100" font-family="Arial, sans-serif" font-size="24" 
              text-anchor="middle" fill="${textColor}">${nameOnSticker}</text>
        <text x="150" y="130" font-family="Arial, sans-serif" font-size="16" 
              text-anchor="middle" fill="${textColor}">${flagCode}</text>
        <circle cx="250" cy="50" r="30" fill="#e5e7eb"/>
        <text x="250" y="55" font-family="Arial, sans-serif" font-size="12" 
              text-anchor="middle" fill="#374151">QR</text>
      </svg>
    `;
  };

  const generateStickerPNG = async (order: Order): Promise<Blob> => {
    const svgContent = generateStickerSVG(order);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

    canvas.width = 300;
    canvas.height = 200;

    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('No se pudo generar el PNG'));
          }
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = url;
    });
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
    <div className="space-y-6">
      {/* Tabla de órdenes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                País
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pago
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
            {orders.map((order) => (
              <tr key={order.id}>
                {/* Usuario */}
                <td className="py-4 px-6">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.owner.name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.owner.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Estado */}
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.displayStatus || order.status)}`}
                    >
                      {getStatusLabel(order.displayStatus || order.status)}
                    </span>
                    {order.inconsistency && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        {order.inconsistency}
                      </span>
                    )}
                  </div>
                </td>

                {/* País */}
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-900">
                    {order.owner.country}
                  </div>
                </td>

                {/* Contacto */}
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-900">
                    {order.emergencyContacts &&
                    order.emergencyContacts.length > 0 ? (
                      <div>
                        <div>{order.emergencyContacts[0].name}</div>
                        <div className="text-gray-500">
                          {order.emergencyContacts[0].phone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Sin contacto</span>
                    )}
                  </div>
                </td>

                {/* Pago */}
                <td className="py-4 px-6">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(order.totalAmount, 'CLP')}
                    </div>
                    <div className="text-gray-500">
                      {getPaymentStatus(order.payments)}
                    </div>
                  </div>
                </td>

                {/* Fecha */}
                <td className="py-4 px-6">
                  <div className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </div>
                </td>

                {/* Acciones */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {/* Botón Ver */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOrder(order)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Botón Editar */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditOrder(order)}
                      title="Editar orden"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Botón Descargar SVG */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadSVG(order)}
                      title="Descargar SVG"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* Botón Descargar PNG */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPNG(order)}
                      title="Descargar PNG"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {/* Botones de transición de estado */}
                    {order.displayStatus === 'ORDERED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'PAID')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Marcar Pagada'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'REJECTED')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Rechazar'}
                        </Button>
                      </>
                    )}

                    {order.displayStatus === 'PAID' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'PRINTING')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Imprimir'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'ORDERED')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Volver a Creada'}
                        </Button>
                      </>
                    )}

                    {order.displayStatus === 'PRINTING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'SHIPPED')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Enviar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'PAID')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Volver a Pagada'}
                        </Button>
                      </>
                    )}

                    {order.displayStatus === 'SHIPPED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'ACTIVE')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'PRINTING')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Volver a Imprimiendo'}
                        </Button>
                      </>
                    )}

                    {order.displayStatus === 'ACTIVE' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'LOST')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Marcar Perdida'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() =>
                            handleStatusTransition(order.id, 'SHIPPED')
                          }
                          disabled={isUpdating === order.id}
                        >
                          {isUpdating === order.id
                            ? 'Actualizando...'
                            : 'Volver a Enviada'}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de vista previa */}
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

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Información del cliente</h4>
                  <p>
                    <strong>Nombre:</strong> {selectedOrder.owner.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedOrder.owner.email}
                  </p>
                  <p>
                    <strong>País:</strong> {selectedOrder.owner.country}
                  </p>
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
  );
}

// Funciones auxiliares
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

function getPaymentStatus(payments: any[]): string {
  if (!payments || payments.length === 0) return 'Sin pagos';

  const hasPaid = payments.some((p) => p.status === 'PAID');
  const hasPending = payments.some((p) => p.status === 'PENDING');

  if (hasPaid) return 'Pagado';
  if (hasPending) return 'Pendiente';
  return 'Sin pagos';
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
