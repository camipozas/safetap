import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentsTable from '@/components/ui/payments-table';
import { prisma } from '@/lib/prisma';

// Revalidate this page every time it's accessed
export const revalidate = 0;

async function getPayments() {
  return await prisma.payment.findMany({
    where: {
      Sticker: {
        isNot: null, // Only include payments that have a sticker
      },
    },
    include: {
      Sticker: {
        select: {
          id: true,
          slug: true,
          nameOnSticker: true,
          status: true,
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              country: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });
}

export default async function PaymentsPage() {
  const payments = await getPayments();

  const stats = {
    total: payments.length,
    pending: payments.filter((p) => p.status === 'PENDING').length,
    transferPayment: payments.filter((p) => p.status === 'TRANSFER_PAYMENT')
      .length,
    verified: payments.filter((p) => p.status === 'VERIFIED').length,
    paid: payments.filter((p) => p.status === 'PAID').length,
    transferred: payments.filter((p) => p.status === 'TRANSFERRED').length,
    rejected: payments.filter((p) => p.status === 'REJECTED').length,
    cancelled: payments.filter((p) => p.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los estados de pagos y transiciones entre estados
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">sin procesar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.transferPayment}
            </div>
            <p className="text-xs text-muted-foreground">en transferencia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verificado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.verified}
            </div>
            <p className="text-xs text-muted-foreground">verificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.paid}
            </div>
            <p className="text-xs text-muted-foreground">confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transferido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.transferred}
            </div>
            <p className="text-xs text-muted-foreground">completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rechazado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground">fallidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cancelado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.cancelled}
            </div>
            <p className="text-xs text-muted-foreground">cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <PaymentsTable payments={payments as any} />
    </div>
  );
}
