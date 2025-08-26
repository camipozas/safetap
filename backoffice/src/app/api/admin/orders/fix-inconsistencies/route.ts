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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Development bypass - allow operations without session for testing
    if (process.env.NODE_ENV === 'development' && !session) {
      console.log('🚀 Development mode: Bypassing authentication for testing');
    } else {
      // Normal authentication flow
      if (!session?.user?.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const canManage = hasPermission(session.user.role, 'canManageOrders');
      if (!canManage) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Get all orders with their payments
    const orders = await prisma.sticker.findMany({
      include: {
        payments: {
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

    // Analyze each order for inconsistencies
    for (const order of orders) {
      const paymentInfo = analyzePayments(order.payments);
      const displayStatus = getDisplayStatus(
        order.status as OrderStatus,
        paymentInfo
      );

      // If the display status is different from the current status, we need to update
      if (displayStatus.primaryStatus !== order.status) {
        updates.push({
          id: order.id,
          oldStatus: order.status as OrderStatus,
          newStatus: displayStatus.primaryStatus,
          reason: displayStatus.description,
        });
      }
    }

    // Apply the updates
    const updatePromises = updates.map((update) =>
      prisma.sticker.update({
        where: { id: update.id },
        data: { status: update.newStatus },
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Development bypass - allow operations without session for testing
    if (process.env.NODE_ENV === 'development' && !session) {
      console.log('🚀 Development mode: Bypassing authentication for testing');
    } else {
      // Normal authentication flow
      if (!session?.user?.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const canManage = hasPermission(session.user.role, 'canManageOrders');
      if (!canManage) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Get all orders with their payments
    const orders = await prisma.sticker.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
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

    // Analyze each order for inconsistencies
    for (const order of orders) {
      const paymentInfo = analyzePayments(order.payments);
      const displayStatus = getDisplayStatus(
        order.status as OrderStatus,
        paymentInfo
      );

      // If the display status is different from the current status, there's an inconsistency
      if (displayStatus.primaryStatus !== order.status) {
        inconsistencies.push({
          id: order.id,
          currentStatus: order.status as OrderStatus,
          suggestedStatus: displayStatus.primaryStatus,
          reason: displayStatus.description,
          owner: order.owner,
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
