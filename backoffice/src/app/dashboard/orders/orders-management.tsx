'use client';

import {
  ChevronDown,
  Download,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

interface Order {
  id: string;
  status: string;
  displayStatus: string;
  displayDescription: string;
  displaySecondaryStatuses: string[];
  createdAt: Date;
  owner: {
    id: string;
    email: string;
    name: string | null;
    country: string | null;
  };
  profile: {
    bloodType: string | null;
    allergies: string[] | null;
    conditions: string[] | null;
    medications: string[] | null;
    notes: string | null;
    contacts: Array<{
      name: string;
      phone: string;
      relation: string;
    }>;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    currency: string;
    createdAt: Date;
  }>;
  paymentInfo: {
    totalAmount: number;
    currency: string;
    hasConfirmedPayment: boolean;
    hasPendingPayment: boolean;
    hasRejectedPayment: boolean;
    latestStatus: string | null;
    paymentCount: number;
  };
}

interface OrdersManagementProps {
  orders: Order[];
}

const statusColors = {
  ORDERED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PRINTING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  LOST: 'bg-red-100 text-red-800',
  REJECTED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  ORDERED: 'Creada',
  PAID: 'Pagada',
  PRINTING: 'Imprimiendo',
  SHIPPED: 'Enviada',
  ACTIVE: 'Activa',
  LOST: 'Perdida',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

export default function OrdersManagement({ orders }: OrdersManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: orders.length,
      ordered: orders.filter((o) => o.displayStatus === 'ORDERED').length,
      paid: orders.filter((o) => o.displayStatus === 'PAID').length,
      printing: orders.filter((o) => o.displayStatus === 'PRINTING').length,
      shipped: orders.filter((o) => o.displayStatus === 'SHIPPED').length,
      active: orders.filter((o) => o.displayStatus === 'ACTIVE').length,
      lost: orders.filter((o) => o.displayStatus === 'LOST').length,
      rejected: orders.filter((o) => o.displayStatus === 'REJECTED').length,
      cancelled: orders.filter((o) => o.displayStatus === 'CANCELLED').length,
    };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          order.owner.email.toLowerCase().includes(searchLower) ||
          (order.owner.name &&
            order.owner.name.toLowerCase().includes(searchLower)) ||
          order.id.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && order.displayStatus !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== 'ALL' && order.owner.country !== countryFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, countryFilter]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    orders.forEach((o) => {
      if (o.owner.country) {
        countrySet.add(o.owner.country);
      }
    });
    return Array.from(countrySet).sort();
  }, [orders]);

  const formatCurrency = (amountCents: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
    }).format(amountCents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusTransition = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(orderId);

      const response = await fetch(`/api/admin/orders/${orderId}/transition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newStatus,
          updatePayment: newStatus === 'PAID' || newStatus === 'REJECTED',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);

      // Recargar la página para mostrar los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {stats.ordered}
          </div>
          <div className="text-sm text-gray-600">Creadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className="text-sm text-gray-600">Pagadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {stats.printing}
          </div>
          <div className="text-sm text-gray-600">Imprimiendo</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-indigo-600">
            {stats.shipped}
          </div>
          <div className="text-sm text-gray-600">Enviadas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-emerald-600">
            {stats.active}
          </div>
          <div className="text-sm text-gray-600">Activas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          <div className="text-sm text-gray-600">Perdidas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {stats.rejected}
          </div>
          <div className="text-sm text-gray-600">Rechazadas</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </Button>

          {/* Export */}
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="ORDERED">Creadas</option>
                  <option value="PAID">Pagadas</option>
                  <option value="PRINTING">Imprimiendo</option>
                  <option value="SHIPPED">Enviadas</option>
                  <option value="ACTIVE">Activas</option>
                  <option value="LOST">Perdidas</option>
                  <option value="REJECTED">Rechazadas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">Todos los países</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Órdenes ({filteredOrders.length} de {orders.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Usuario
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    País
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Contacto
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Pago
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Usuario */}
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.owner.name ||
                            (order.profile?.contacts &&
                            order.profile.contacts.length > 0
                              ? order.profile.contacts[0].name
                              : 'Sin nombre')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.owner.email}
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <Badge
                          className={
                            statusColors[
                              order.displayStatus as keyof typeof statusColors
                            ] || 'bg-gray-100 text-gray-800'
                          }
                        >
                          {statusLabels[
                            order.displayStatus as keyof typeof statusLabels
                          ] || order.displayStatus}
                        </Badge>
                        {order.displaySecondaryStatuses.map(
                          (secondaryStatus, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {statusLabels[
                                secondaryStatus as keyof typeof statusLabels
                              ] || secondaryStatus}
                            </Badge>
                          )
                        )}
                      </div>
                      {order.displayDescription && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.displayDescription}
                        </div>
                      )}
                    </td>

                    {/* País */}
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {order.owner.country || 'Sin país'}
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="py-4 px-4">
                      {order.profile?.contacts &&
                      order.profile.contacts.length > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {order.profile.contacts[0].name}
                          </div>
                          <div className="text-gray-500">
                            {order.profile.contacts[0].phone}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Sin contacto
                        </div>
                      )}
                    </td>

                    {/* Pago */}
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatCurrency(
                            order.paymentInfo.totalAmount,
                            order.paymentInfo.currency
                          )}
                        </div>
                        <div className="text-gray-500">
                          {order.paymentInfo.latestStatus === 'PENDING' &&
                            'Pendiente'}
                          {order.paymentInfo.latestStatus === 'VERIFIED' &&
                            'Verificado'}
                          {order.paymentInfo.latestStatus === 'REJECTED' &&
                            'Rechazado'}
                          {order.paymentInfo.latestStatus === 'CANCELLED' &&
                            'Cancelado'}
                        </div>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
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
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
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
                          </>
                        )}

                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron órdenes que coincidan con los filtros
                aplicados.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
