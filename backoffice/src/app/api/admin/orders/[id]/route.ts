import { authOptions } from '@/lib/auth';
import {
  ORDER_STATUS,
  getPaymentStatusForOrderStatus,
} from '@/lib/order-helpers';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    // Development bypass - allow operations without session for testing
    if (process.env.NODE_ENV === 'development' && !session) {
      // eslint-disable-next-line no-console
      console.log('🚀 Development mode: Bypassing authentication for testing');

      // Continue with the operation without authentication check
      const { status } = await request.json();
      const orderId = params.id;

      const validStatuses = Object.values(ORDER_STATUS);

      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
      }

      // Check if this is a batch order (has groupId) or single order
      const currentSticker = await prisma.sticker.findUnique({
        where: { id: orderId },
        select: { id: true, groupId: true, status: true },
      });

      if (!currentSticker) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const isBatchOrder = !!currentSticker.groupId;

      console.error('🔍 Order type analysis:', {
        orderId: orderId.slice(0, 8) + '...',
        groupId: currentSticker.groupId?.slice(0, 8) + '...' || 'none',
        isBatchOrder,
        currentStatus: currentSticker.status,
        newStatus: status,
      });

      // Get the target payment status for this order status
      const targetPaymentStatus = getPaymentStatusForOrderStatus(status);

      if (isBatchOrder) {
        // For batch orders, update ALL stickers in the group
        console.error(
          '📦 Updating batch order - all stickers in group will be updated'
        );

        const updateResult = await prisma.sticker.updateMany({
          where: { groupId: currentSticker.groupId },
          data: {
            status,
            updatedAt: new Date(),
          },
        });

        console.error(`✅ Updated ${updateResult.count} stickers in batch`);

        // Update payments for all stickers in the group
        if (targetPaymentStatus) {
          await prisma.payment.updateMany({
            where: {
              Sticker: {
                groupId: currentSticker.groupId,
              },
            },
            data: {
              status: targetPaymentStatus,
              updatedAt: new Date(),
            },
          });
        }

        // Return the updated original sticker for response
        const updatedSticker = await prisma.sticker.findUnique({
          where: { id: orderId },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          sticker: updatedSticker,
          isBatchUpdate: true,
          updatedCount: updateResult.count,
          devBypass: true,
        });
      } else {
        // For single orders, update only this sticker
        console.error(
          '🎯 Updating single order - only this sticker will be updated'
        );

        const updatedSticker = await prisma.sticker.update({
          where: { id: orderId },
          data: {
            status,
            updatedAt: new Date(),
          },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Update payments for this specific sticker
        if (targetPaymentStatus) {
          await prisma.payment.updateMany({
            where: {
              Sticker: {
                id: orderId,
              },
            },
            data: {
              status: targetPaymentStatus,
              updatedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          sticker: updatedSticker,
          isBatchUpdate: false,
          updatedCount: 1,
          devBypass: true,
        });
      }
    }

    // Normal authentication flow
    if (!session) {
      return NextResponse.json(
        {
          error: 'No session found',
          debug: 'User is not authenticated',
        },
        { status: 401 }
      );
    }

    if (!session.user) {
      return NextResponse.json(
        {
          error: 'No user in session',
          debug: 'Session exists but no user data',
        },
        { status: 401 }
      );
    }

    if (!session.user.role) {
      return NextResponse.json(
        {
          error: 'No role found',
          debug: 'User has no role assigned',
        },
        { status: 401 }
      );
    }

    const canManage = hasPermission(session.user.role, 'canManageOrders');
    if (!canManage) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          debug: {
            userRole: session.user.role,
            canManageOrders: canManage,
            userEmail: session.user.email,
          },
        },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const orderId = params.id;

    const validStatuses = Object.values(ORDER_STATUS);

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Check if this is a batch order (has groupId) or single order
    const currentSticker = await prisma.sticker.findUnique({
      where: { id: orderId },
      select: { id: true, groupId: true, status: true },
    });

    if (!currentSticker) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isBatchOrder = !!currentSticker.groupId;

    console.error('🔍 Order type analysis (authenticated):', {
      orderId: orderId.slice(0, 8) + '...',
      groupId: currentSticker.groupId?.slice(0, 8) + '...' || 'none',
      isBatchOrder,
      currentStatus: currentSticker.status,
      newStatus: status,
    });

    // Get the target payment status for this order status
    const targetPaymentStatus = getPaymentStatusForOrderStatus(status);

    if (isBatchOrder) {
      // For batch orders, update ALL stickers in the group
      console.error(
        '📦 Updating batch order (authenticated) - all stickers in group will be updated'
      );

      const updateResult = await prisma.sticker.updateMany({
        where: { groupId: currentSticker.groupId },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      console.error(
        `✅ Updated ${updateResult.count} stickers in batch (authenticated)`
      );

      // Update payments for all stickers in the group
      if (targetPaymentStatus) {
        await prisma.payment.updateMany({
          where: {
            Sticker: {
              groupId: currentSticker.groupId,
            },
          },
          data: {
            status: targetPaymentStatus,
            updatedAt: new Date(),
          },
        });
      }

      // Return the updated original sticker for response
      const updatedSticker = await prisma.sticker.findUnique({
        where: { id: orderId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        sticker: updatedSticker,
        isBatchUpdate: true,
        updatedCount: updateResult.count,
      });
    } else {
      // For single orders, update only this sticker
      console.error(
        '🎯 Updating single order (authenticated) - only this sticker will be updated'
      );

      const updatedSticker = await prisma.sticker.update({
        where: { id: orderId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update payments for this specific sticker
      if (targetPaymentStatus) {
        await prisma.payment.updateMany({
          where: {
            Sticker: {
              id: orderId,
            },
          },
          data: {
            status: targetPaymentStatus,
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        sticker: updatedSticker,
        isBatchUpdate: false,
        updatedCount: 1,
      });
    }
  } catch (error) {
    // Si es un error de Prisma, proporcionar más detalles
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !hasPermission(session.user.role, 'canManageOrders')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    const sticker = await prisma.sticker.findUnique({
      where: { id: orderId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            country: true,
          },
        },
        Payment: {
          where: {
            status: 'VERIFIED',
          },
          select: {
            amount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
    });

    if (!sticker) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ sticker });
  } catch (error) {
    console.error('Error in GET order endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
