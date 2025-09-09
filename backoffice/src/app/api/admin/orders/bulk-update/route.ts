import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { orderIds, status } = body;

    console.error('Bulk update request:', {
      orderIds,
      status,
      count: orderIds?.length,
      firstFewIds:
        orderIds?.slice(0, 3).map((id: string) => id.slice(0, 8) + '...') || [],
    });

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de orderIds' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Se requiere el nuevo status' },
        { status: 400 }
      );
    }

    // First, get the orders to find their groupIds
    const initialOrders = await prisma.sticker.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      select: {
        id: true,
        groupId: true,
        status: true,
        ownerId: true,
        createdAt: true,
      },
    });

    console.error('Initial orders found:', initialOrders.length);

    // Collect all groupIds from the initial orders (exclude null values)
    const groupIds = initialOrders
      .map((order) => order.groupId)
      .filter((groupId): groupId is string => groupId !== null);

    console.error('Group IDs found:', groupIds);

    // Find ALL orders that belong to these groups
    let allRelatedOrderIds = [...initialOrders];

    if (groupIds.length > 0) {
      const groupRelatedOrders = await prisma.sticker.findMany({
        where: {
          groupId: {
            in: groupIds,
          },
        },
        select: {
          id: true,
          groupId: true,
          status: true,
          ownerId: true,
          createdAt: true,
        },
      });

      console.error('Group-related orders found:', groupRelatedOrders.length);

      // Combine initial orders with group-related orders, removing duplicates
      const allOrdersMap = new Map();

      // Add initial orders
      initialOrders.forEach((order) => allOrdersMap.set(order.id, order));

      // Add group-related orders
      groupRelatedOrders.forEach((order) => allOrdersMap.set(order.id, order));

      allRelatedOrderIds = Array.from(allOrdersMap.values());
    }

    const finalOrderIds = allRelatedOrderIds.map((order) => order.id);

    console.error('Extended order IDs for group update:', {
      originalOrderIds: orderIds,
      originalCount: orderIds.length,
      finalOrderIds: finalOrderIds,
      finalCount: finalOrderIds.length,
      groupIds: groupIds,
      affectedGroups: groupIds.length,
    });

    // Validate that all final orderIds exist and get their current payment info
    const existingOrders = await prisma.sticker.findMany({
      where: {
        id: {
          in: finalOrderIds,
        },
      },
      select: {
        id: true,
        status: true,
        Payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    console.error(
      'Found orders:',
      existingOrders.length,
      'out of',
      finalOrderIds.length
    );

    if (existingOrders.length !== finalOrderIds.length) {
      const foundIds = existingOrders.map((o) => o.id);
      const missingIds = finalOrderIds.filter(
        (id: string) => !foundIds.includes(id)
      );
      console.error('Missing order IDs:', missingIds);
      return NextResponse.json(
        {
          error: `Algunos stickers no fueron encontrados: ${missingIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    // For certain transitions, validate payment status (but be more lenient now that we regularized)
    const requiresPaymentValidation = [
      'PAID',
      'PRINTING',
      'SHIPPED',
      'ACTIVE',
    ].includes(status);

    if (requiresPaymentValidation) {
      const ordersWithoutValidPayments = existingOrders.filter((order) => {
        const hasValidPayment = order.Payment.some(
          (p) =>
            p.status === 'PAID' ||
            p.status === 'VERIFIED' ||
            p.status === 'PENDING'
        );
        return !hasValidPayment;
      });

      if (ordersWithoutValidPayments.length > 0) {
        console.error(
          'Orders without valid payments:',
          ordersWithoutValidPayments.map((o) => o.id)
        );
        // Instead of rejecting, let's be more informative
        console.error(
          `Warning: ${ordersWithoutValidPayments.length} orders don't have valid payments, but proceeding with update...`
        );
      }
    }

    // Perform bulk update - update ALL related stickers (including those from groups)
    const updateResult = await prisma.sticker.updateMany({
      where: {
        id: {
          in: finalOrderIds,
        },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Also update payment status if transitioning to/from PAID status
    let paymentUpdateResult = null;
    if (status === 'PAID') {
      // When marking as PAID, update payment status to PAID
      // For batch orders, we need to update payments based on groupId since only the primary sticker has a payment
      if (groupIds.length > 0) {
        // Update payments for batch orders using groupId
        paymentUpdateResult = await prisma.payment.updateMany({
          where: {
            Sticker: {
              groupId: {
                in: groupIds,
              },
            },
          },
          data: {
            status: 'PAID',
            updatedAt: new Date(),
          },
        });
      } else {
        // Update payments for individual orders using stickerId
        paymentUpdateResult = await prisma.payment.updateMany({
          where: {
            stickerId: {
              in: finalOrderIds,
            },
          },
          data: {
            status: 'PAID',
            updatedAt: new Date(),
          },
        });
      }
      console.error('Payment status updated to PAID:', {
        count: paymentUpdateResult.count,
        method: groupIds.length > 0 ? 'groupId' : 'stickerId',
      });
    } else if (status === 'ORDERED') {
      // When reverting to ORDERED, update payment status back to PENDING
      if (groupIds.length > 0) {
        // Update payments for batch orders using groupId
        paymentUpdateResult = await prisma.payment.updateMany({
          where: {
            Sticker: {
              groupId: {
                in: groupIds,
              },
            },
          },
          data: {
            status: 'PENDING',
            updatedAt: new Date(),
          },
        });
      } else {
        // Update payments for individual orders using stickerId
        paymentUpdateResult = await prisma.payment.updateMany({
          where: {
            stickerId: {
              in: finalOrderIds,
            },
          },
          data: {
            status: 'PENDING',
            updatedAt: new Date(),
          },
        });
      }
      console.error('Payment status updated to PENDING:', {
        count: paymentUpdateResult.count,
        method: groupIds.length > 0 ? 'groupId' : 'stickerId',
      });
    }

    console.error('Update result:', {
      count: updateResult.count,
      paymentUpdates: paymentUpdateResult?.count || 0,
      modifiedIds: finalOrderIds
        .slice(0, 5)
        .map((id: string) => id.slice(0, 8) + '...'),
      newStatus: status,
      groupsInvolved: groupIds.length,
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      paymentUpdates: paymentUpdateResult?.count || 0,
      originalRequestCount: orderIds.length,
      finalUpdateCount: finalOrderIds.length,
      groupsAffected: groupIds.length,
      message: `${updateResult.count} stickers actualizados exitosamente a estado ${status}${
        paymentUpdateResult?.count
          ? ` (${paymentUpdateResult.count} pagos actualizados)`
          : ''
      }${groupIds.length > 0 ? ` (incluyendo ${groupIds.length} grupo(s))` : ''}`,
    });
  } catch (error) {
    console.error('Error en bulk update:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
