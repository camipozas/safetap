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
        },
      },
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
      },
      Payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
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
      status: order.status,
      displayStatus: displayStatus.primaryStatus,
      displayDescription: displayStatus.description,
      displaySecondaryStatuses: displayStatus.secondaryStatuses,
      createdAt: order.createdAt,
      owner: order.User,
      profile: order.EmergencyProfile
        ? {
            ...order.EmergencyProfile,
            contacts: order.EmergencyProfile.EmergencyContact,
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

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    redirect('/dashboard');
  }

  const orders = await getOrdersData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
        <p className="text-gray-600 mt-2">
          Administra y supervisa todas las órdenes del sistema
        </p>
      </div>

      <Suspense fallback={<div>Cargando órdenes...</div>}>
        <OrdersManagement orders={orders} />
      </Suspense>
    </div>
  );
}
