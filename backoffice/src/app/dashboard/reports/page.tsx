import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, TrendingUp, Users } from 'lucide-react';

async function getReportsData() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  const [
    monthlyRevenue,
    lastMonthRevenue,
    yearlyRevenue,
    monthlyOrders,
    lastMonthOrders,
    yearlyOrders,
    monthlyUsers,
    lastMonthUsers,
    yearlyUsers,
    topCountries,
    recentActivity,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: 'VERIFIED',
        createdAt: { gte: thisMonth },
      },
      _sum: { amountCents: true },
    }),

    prisma.payment.aggregate({
      where: {
        status: 'VERIFIED',
        createdAt: { gte: lastMonth, lte: lastMonthEnd },
      },
      _sum: { amountCents: true },
    }),

    prisma.payment.aggregate({
      where: {
        status: 'VERIFIED',
        createdAt: { gte: thisYear },
      },
      _sum: { amountCents: true },
    }),

    prisma.payment.count({
      where: { createdAt: { gte: thisMonth } },
    }),

    prisma.payment.count({
      where: { createdAt: { gte: lastMonth, lte: lastMonthEnd } },
    }),

    prisma.payment.count({
      where: { createdAt: { gte: thisYear } },
    }),

    prisma.user.count({
      where: { createdAt: { gte: thisMonth } },
    }),

    prisma.user.count({
      where: { createdAt: { gte: lastMonth, lte: lastMonthEnd } },
    }),

    prisma.user.count({
      where: { createdAt: { gte: thisYear } },
    }),

    prisma.user.groupBy({
      by: ['country'],
      where: { country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),

    prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } },
        sticker: { select: { nameOnSticker: true } },
      },
    }),
  ]);

  return {
    revenue: {
      thisMonth: monthlyRevenue._sum.amountCents || 0,
      lastMonth: lastMonthRevenue._sum.amountCents || 0,
      thisYear: yearlyRevenue._sum.amountCents || 0,
    },
    orders: {
      thisMonth: monthlyOrders,
      lastMonth: lastMonthOrders,
      thisYear: yearlyOrders,
    },
    users: {
      thisMonth: monthlyUsers,
      lastMonth: lastMonthUsers,
      thisYear: yearlyUsers,
    },
    topCountries,
    recentActivity,
  };
}

export default async function ReportsPage() {
  const data = await getReportsData();

  const revenueGrowth =
    data.revenue.lastMonth > 0
      ? ((data.revenue.thisMonth - data.revenue.lastMonth) /
          data.revenue.lastMonth) *
        100
      : 0;

  const orderGrowth =
    data.orders.lastMonth > 0
      ? ((data.orders.thisMonth - data.orders.lastMonth) /
          data.orders.lastMonth) *
        100
      : 0;

  const userGrowth =
    data.users.lastMonth > 0
      ? ((data.users.thisMonth - data.users.lastMonth) / data.users.lastMonth) *
        100
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">Reportes y exportación de datos</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
        </div>
      </div>

      {/* Montly Revenue Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue.thisMonth)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span
                className={
                  revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {revenueGrowth >= 0 ? '+' : ''}
                {revenueGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Año: {formatCurrency(data.revenue.thisYear)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes del Mes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.orders.thisMonth}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span
                className={orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {orderGrowth >= 0 ? '+' : ''}
                {orderGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Año: {data.orders.thisYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.thisMonth}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span
                className={userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {userGrowth >= 0 ? '+' : ''}
                {userGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Año: {data.users.thisYear}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top of countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Países por Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCountries.map((country, index) => (
                <div
                  key={country.country}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {country._count.id} usuarios
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {activity.user.name || activity.user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.sticker?.nameOnSticker || 'Sin sticker'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(activity.amountCents)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte de Ventas</h3>
              <p className="text-sm text-gray-600">
                Análisis completo de ventas por período
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Generar
              </Button>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte de Usuarios</h3>
              <p className="text-sm text-gray-600">
                Lista detallada de usuarios y actividad
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Generar
              </Button>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte de Stickers</h3>
              <p className="text-sm text-gray-600">
                Estado y uso de todos los stickers
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Generar
              </Button>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte Financiero</h3>
              <p className="text-sm text-gray-600">
                Análisis financiero y trending
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Generar
              </Button>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte de Accesos</h3>
              <p className="text-sm text-gray-600">
                Log de accesos a perfiles de emergencia
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Generar
              </Button>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <h3 className="font-medium">Reporte Personalizado</h3>
              <p className="text-sm text-gray-600">
                Crear reporte con filtros específicos
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Configurar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
