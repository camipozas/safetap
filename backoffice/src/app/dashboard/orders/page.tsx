import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import OrdersTable from '../../../components/ui/orders-table';

async function getOrders() {
  return await prisma.sticker.findMany({
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          country: true,
        },
      },
      profile: {
        select: {
          bloodType: true,
          allergies: true,
          conditions: true,
          medications: true,
          notes: true,
          contacts: {
            where: {
              preferred: true,
            },
            take: 1,
            select: {
              name: true,
              phone: true,
              relation: true,
            },
          },
        },
      },
      payments: {
        where: {
          status: 'VERIFIED',
        },
        select: {
          amountCents: true,
          currency: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });
}

export default async function OrdersPage() {
  const orders = await getOrders();

  const stats = {
    total: orders.length,
    ordered: orders.filter((o) => o.status === 'ORDERED').length,
    paid: orders.filter((o) => o.status === 'PAID').length,
    printing: orders.filter((o) => o.status === 'PRINTING').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    active: orders.filter((o) => o.status === 'ACTIVE').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <p className="text-gray-600 mt-2">
          Gestiona el flujo completo de órdenes desde creación hasta
          finalización
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">órdenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Creadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.ordered}
            </div>
            <p className="text-xs text-muted-foreground">pendientes pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">listas imprimir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Imprimiendo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.printing}
            </div>
            <p className="text-xs text-muted-foreground">en proceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.shipped}
            </div>
            <p className="text-xs text-muted-foreground">en camino</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">finalizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tablero de Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
