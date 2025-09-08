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

async function getOrdersData() {
  const rawOrders = await prisma.sticker.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
  });

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

  return processedOrders;
}

export default async function OrdersPage() {
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

  const orders = await getOrdersData();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <p className="text-gray-600 mt-2">
          Administra y supervisa todas las órdenes del sistema
        </p>
      </div>

      {/* Payment Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Resumen de Pagos
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

      <Suspense fallback={<div>Cargando órdenes...</div>}>
        <OrdersManagement orders={orders} />
      </Suspense>
    </div>
  );
}
