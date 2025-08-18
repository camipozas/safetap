import {
  CountryChart,
  OrdersChart,
  RevenueChart,
  StickerStatusChart,
} from '@/components/charts/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

async function getAnalyticsData() {
  const last30Days = subDays(new Date(), 30);

  const revenueData = await prisma.payment.groupBy({
    by: ['createdAt'],
    where: {
      status: 'VERIFIED',
      createdAt: {
        gte: last30Days,
      },
    },
    _sum: {
      amountCents: true,
    },
  });

  const ordersData = await prisma.payment.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: last30Days,
      },
    },
    _count: {
      id: true,
    },
  });

  const stickerStatus = await prisma.sticker.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  });

  const countryData = await prisma.user.groupBy({
    by: ['country'],
    where: {
      country: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  const usersData = await prisma.user.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: last30Days,
      },
    },
    _count: {
      id: true,
    },
  });

  const revenueByDay: { [key: string]: number } = {};
  revenueData.forEach((item) => {
    const day = format(item.createdAt, 'yyyy-MM-dd');
    revenueByDay[day] = (revenueByDay[day] || 0) + (item._sum.amountCents || 0);
  });

  const ordersByDay: { [key: string]: number } = {};
  ordersData.forEach((item) => {
    const day = format(item.createdAt, 'yyyy-MM-dd');
    ordersByDay[day] = (ordersByDay[day] || 0) + item._count.id;
  });

  const usersByDay: { [key: string]: number } = {};
  usersData.forEach((item) => {
    const day = format(item.createdAt, 'yyyy-MM-dd');
    usersByDay[day] = (usersByDay[day] || 0) + item._count.id;
  });

  const chartData = {
    revenue: Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const day = format(date, 'yyyy-MM-dd');
      return {
        name: format(date, 'dd/MM', { locale: es }),
        value: (revenueByDay[day] || 0) / 100,
      };
    }),
    orders: Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const day = format(date, 'yyyy-MM-dd');
      return {
        name: format(date, 'dd/MM', { locale: es }),
        value: ordersByDay[day] || 0,
      };
    }),
    users: Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const day = format(date, 'yyyy-MM-dd');
      return {
        name: format(date, 'dd/MM', { locale: es }),
        value: usersByDay[day] || 0,
      };
    }),
    stickerStatus: stickerStatus.map((item) => ({
      name: item.status,
      value: item._count.id,
    })),
    countries: countryData.map((item) => ({
      name: item.country || 'Desconocido',
      value: item._count.id,
    })),
  };

  return chartData;
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Análisis detallado de métricas y tendencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos (Últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes (Últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={data.orders} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Stickers</CardTitle>
          </CardHeader>
          <CardContent>
            <StickerStatusChart data={data.stickerStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios por País (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <CountryChart data={data.countries} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                €
                {data.revenue
                  .reduce((sum, item) => sum + item.value, 0)
                  .toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Ingresos últimos 30 días</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.orders.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <p className="text-sm text-gray-600">Órdenes últimos 30 días</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.users.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <p className="text-sm text-gray-600">
                Nuevos usuarios últimos 30 días
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
