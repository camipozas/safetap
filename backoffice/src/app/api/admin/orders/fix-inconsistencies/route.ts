/* eslint-disable no-console */
import { authOptions } from '@/lib/auth';
import {
  analyzePayments,
  getDisplayStatus,
  type OrderStatus,
} from '@/lib/order-helpers';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Fix inconsistencies
 * @param request - The request object
 * @returns - The response object
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (process.env.NODE_ENV === 'development' && !session) {
      console.log('🚀 Development mode: Bypassing authentication for testing');
    } else {
      if (!session?.user?.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const canManage = hasPermission(session.user.role, 'canManageOrders');
      if (!canManage) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const orders = await prisma.sticker.findMany({
      include: {
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
    });

    const updates: Array<{
      id: string;
      oldStatus: OrderStatus;
      newStatus: OrderStatus;
      reason: string;
    }> = [];

    for (const order of orders) {
      const paymentInfo = analyzePayments(order.Payment);
      const displayStatus = getDisplayStatus(
        order.status as OrderStatus,
        paymentInfo
      );

      if (displayStatus.primaryStatus !== order.status) {
        updates.push({
          id: order.id,
          oldStatus: order.status as OrderStatus,
          newStatus: displayStatus.primaryStatus,
          reason: displayStatus.description,
        });
      }
    }

    const updatePromises = updates.map((update) =>
      prisma.sticker.update({
        where: { id: update.id },
        data: {
          status: update.newStatus as
            | 'ORDERED'
            | 'PAID'
            | 'PRINTING'
            | 'SHIPPED'
            | 'ACTIVE'
            | 'LOST',
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} inconsistencies`,
      updates,
      totalOrders: orders.length,
    });
  } catch (error) {
    console.error('Error fixing inconsistencies:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check inconsistencies
 * @param request - The request object
 * @returns - The response object
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (process.env.NODE_ENV === 'development' && !session) {
      console.log('🚀 Development mode: Bypassing authentication for testing');
    } else {
      if (!session?.user?.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const canManage = hasPermission(session.user.role, 'canManageOrders');
      if (!canManage) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const orders = await prisma.sticker.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    const inconsistencies: Array<{
      id: string;
      currentStatus: OrderStatus;
      suggestedStatus: OrderStatus;
      reason: string;
      owner: { name: string | null; email: string };
      paymentInfo: {
        totalAmount: number;
        hasConfirmedPayment: boolean;
        hasPendingPayment: boolean;
        paymentCount: number;
      };
    }> = [];

    for (const order of orders) {
      const paymentInfo = analyzePayments(order.Payment);
      const displayStatus = getDisplayStatus(
        order.status as OrderStatus,
        paymentInfo
      );

      if (displayStatus.primaryStatus !== order.status) {
        inconsistencies.push({
          id: order.id,
          currentStatus: order.status as OrderStatus,
          suggestedStatus: displayStatus.primaryStatus,
          reason: displayStatus.description,
          owner: order.User,
          paymentInfo: {
            totalAmount: paymentInfo.totalAmount,
            hasConfirmedPayment: paymentInfo.hasConfirmedPayment,
            hasPendingPayment: paymentInfo.hasPendingPayment,
            paymentCount: paymentInfo.paymentCount,
          },
        });
      }
    }

    return NextResponse.json({
      inconsistencies,
      totalOrders: orders.length,
      inconsistentCount: inconsistencies.length,
    });
  } catch (error) {
    console.error('Error checking inconsistencies:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
