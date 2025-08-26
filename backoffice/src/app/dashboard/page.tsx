import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { calculateGrowthPercentage, formatCurrency } from '@/lib/utils';
import {
  AlertCircle,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

async function getDashboardStats() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    activeStickers,
    pendingPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count(),
    prisma.payment.aggregate({
      where: { status: 'VERIFIED' },
      _sum: { amount: true },
    }),
    prisma.sticker.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  const [thisMonthUsers, thisMonthOrders, thisMonthRevenue] = await Promise.all(
    [
      prisma.user.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
    ]
  );

  const [lastMonthUsers, lastMonthOrders, lastMonthRevenue] = await Promise.all(
    [
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lte: lastMonthEnd,
          },
        },
      }),
      prisma.payment.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lte: lastMonthEnd,
          },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'VERIFIED',
          createdAt: {
            gte: lastMonth,
            lte: lastMonthEnd,
          },
        },
        _sum: { amount: true },
      }),
    ]
  );

  return {
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue._sum.amount || 0,
    activeStickers,
    pendingPayments,
    thisMonthUsers,
    thisMonthOrders,
    thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
    lastMonthUsers,
    lastMonthOrders,
    lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
    userGrowth: calculateGrowthPercentage(thisMonthUsers, lastMonthUsers),
    orderGrowth: calculateGrowthPercentage(thisMonthOrders, lastMonthOrders),
    revenueGrowth: calculateGrowthPercentage(
      thisMonthRevenue._sum.amount || 0,
      lastMonthRevenue._sum.amount || 0
    ),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Usuarios Totales',
      value: stats.totalUsers.toLocaleString(),
      change: stats.userGrowth,
      icon: Users,
      description: 'usuarios registrados',
    },
    {
      title: 'Órdenes Totales',
      value: stats.totalOrders.toLocaleString(),
      change: stats.orderGrowth,
      icon: Package,
      description: 'órdenes procesadas',
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueGrowth,
      icon: DollarSign,
      description: 'ingresos verificados',
    },
    {
      title: 'Stickers Activos',
      value: stats.activeStickers.toLocaleString(),
      icon: Package,
      description: 'stickers en uso',
    },
    {
      title: 'Pagos Pendientes',
      value: stats.pendingPayments.toLocaleString(),
      icon: AlertCircle,
      description: 'requieren verificación',
      urgent: stats.pendingPayments > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general de SafeTap</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={card.urgent ? 'border-red-200 bg-red-50' : ''}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon
                className={`h-4 w-4 ${card.urgent ? 'text-red-600' : 'text-muted-foreground'}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change !== undefined && (
                <div className="flex items-center text-xs text-muted-foreground">
                  {card.change > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span
                    className={
                      card.change > 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                  <span className="ml-1">vs mes anterior</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Este mes: {stats.thisMonthUsers} nuevos usuarios,{' '}
                {stats.thisMonthOrders} órdenes
              </div>
              <div className="text-sm text-gray-600">
                Ingresos del mes: {formatCurrency(stats.thisMonthRevenue)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/dashboard/orders"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-safetap-600 hover:text-safetap-800"
              >
                Ver órdenes pendientes →
              </a>
              <a
                href="/dashboard/users"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-safetap-600 hover:text-safetap-800"
              >
                Gestionar usuarios →
              </a>
              <a
                href="/dashboard/analytics"
                className="block p-2 rounded hover:bg-gray-100 text-sm text-safetap-600 hover:text-safetap-800"
              >
                Ver analytics detallados →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
