import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrismaClient } from '@prisma/client';
import UsersTable from '../../../components/ui/users-table';

// Create a direct Accelerate client to avoid any local caching
const accelerateClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // This ensures we use the Accelerate URL
});

async function getUsers() {
  return await accelerateClient.user.findMany({
    include: {
      _count: {
        select: {
          stickers: true,
          payments: true,
        },
      },
      payments: {
        where: {
          status: 'VERIFIED',
        },
        select: {
          amountCents: true,
        },
      },
      profiles: {
        select: {
          bloodType: true,
          allergies: true,
          conditions: true,
          medications: true,
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  const usersWithStats = users.map((user) => ({
    ...user,
    totalSpent: user.payments.reduce(
      (sum, payment) => sum + payment.amountCents,
      0
    ),
  }));

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    withStickers: users.filter((u) => u._count.stickers > 0).length,
    withPayments: users.filter((u) => u._count.payments > 0).length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona todos los usuarios registrados en el sistema
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">con permisos admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Con Stickers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.withStickers}
            </div>
            <p className="text-xs text-muted-foreground">tienen stickers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Con Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.withPayments}
            </div>
            <p className="text-xs text-muted-foreground">han realizado pagos</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable users={usersWithStats} />
        </CardContent>
      </Card>
    </div>
  );
}
