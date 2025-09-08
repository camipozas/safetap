import { USER_ROLES } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { authOptions } from '../../../lib/auth';
import { analyzePayments, getDisplayStatus } from '../../../lib/order-helpers';
import { prisma } from '../../../lib/prisma';
import OrdersManagement from './orders-management';

// Revalidate this page every time it's accessed
export const revalidate = 0;

async function getOrdersData(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const [rawOrders, totalCount] = await Promise.all([
    prisma.sticker.findMany({
      skip: offset,
      take: limit,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
            totalSpent: true,
            EmergencyProfile: {
              select: {
                bloodType: true,
                allergies: true,
                conditions: true,
                medications: true,
                notes: true,
                EmergencyContact: {
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
              orderBy: {
                updatedByUserAt: 'desc',
              },
              take: 1,
            },
          },
        },
        Payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            reference: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    prisma.sticker.count(),
  ]);

  // Process orders with display status
  const processedOrders = rawOrders.map((order) => {
    const paymentInfo = analyzePayments(order.Payment);
    const displayStatus = getDisplayStatus(order.status, paymentInfo);

    return {
      id: order.id,
      slug: order.slug,
      serial: order.serial,
      nameOnSticker: order.nameOnSticker,
      flagCode: order.flagCode,
      stickerColor: order.stickerColor,
      textColor: order.textColor,
      status: order.status,
      displayStatus: displayStatus.primaryStatus,
      displayDescription: displayStatus.description,
      displaySecondaryStatuses: displayStatus.secondaryStatuses,
      createdAt: order.createdAt,
      owner: order.User,
      profile: order.User.EmergencyProfile?.[0]
        ? {
            ...order.User.EmergencyProfile[0],
            contacts: order.User.EmergencyProfile[0].EmergencyContact,
          }
        : null,
      payments: order.Payment,
      paymentInfo,
    };
  });

  return { orders: processedOrders, totalCount };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user has admin permissions
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (
    !user ||
    (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN)
  ) {
    redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const { orders, totalCount } = await getOrdersData(currentPage);

  // Calculate payment statistics from all orders
  const allPayments = orders.flatMap((order) => order.payments);
  const paymentStats = {
    total: allPayments.length,
    pending: allPayments.filter((p) => p.status === 'PENDING').length,
    verified: allPayments.filter((p) => p.status === 'VERIFIED').length,
    paid: allPayments.filter((p) => p.status === 'PAID').length,
    rejected: allPayments.filter((p) => p.status === 'REJECTED').length,
    cancelled: allPayments.filter((p) => p.status === 'CANCELLED').length,
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <p className="text-gray-600 mt-2">
          Administra y supervisa todas las órdenes del sistema ({totalCount}{' '}
          órdenes totales)
        </p>
      </div>

      {/* Payment Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Resumen de Pagos (Página {currentPage} de {totalPages})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {paymentStats.total}
            </div>
            <div className="text-sm text-gray-600">Total Pagos</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {paymentStats.pending}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {paymentStats.verified}
            </div>
            <div className="text-sm text-gray-600">Verificados</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {paymentStats.paid}
            </div>
            <div className="text-sm text-gray-600">Pagados</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {paymentStats.rejected}
            </div>
            <div className="text-sm text-gray-600">Rechazados</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {paymentStats.cancelled}
            </div>
            <div className="text-sm text-gray-600">Cancelados</div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          {currentPage > 1 && (
            <a
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ← Anterior
            </a>
          )}
          {currentPage < totalPages && (
            <a
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Siguiente →
            </a>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Mostrando {orders.length} de {totalCount} órdenes
        </div>
      </div>

      <Suspense fallback={<div>Cargando órdenes...</div>}>
        <OrdersManagement orders={orders} />
      </Suspense>
    </div>
  );
}
