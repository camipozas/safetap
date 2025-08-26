import { authOptions } from '@/lib/auth';
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
      const paymentId = params.id;

      const validStatuses = [
        'PENDING',
        'TRANSFER_PAYMENT',
        'VERIFIED',
        'PAID',
        'TRANSFERRED',
        'REJECTED',
        'CANCELLED',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid payment status' },
          { status: 400 }
        );
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          sticker: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        devBypass: true,
      });
    }

    // Normal authentication flow
    if (!session) {
      return NextResponse.json({ error: 'No authenticated' }, { status: 401 });
    }

    if (!session.user?.email) {
      return NextResponse.json(
        { error: 'No user email found' },
        { status: 401 }
      );
    }

    // Get user and check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user has permission to manage orders (which includes payments)
    if (!hasPermission(user.role, 'canManageOrders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { status } = await request.json();
    const paymentId = params.id;

    const validStatuses = [
      'PENDING',
      'TRANSFER_PAYMENT',
      'VERIFIED',
      'PAID',
      'TRANSFERRED',
      'REJECTED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        sticker: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Log the action for audit purposes
    // eslint-disable-next-line no-console
    console.log(
      `Payment ${paymentId} status updated to ${status} by ${session.user.email}`
    );

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Development bypass - allow operations without session for testing
    if (process.env.NODE_ENV === 'development' && !session) {
      // eslint-disable-next-line no-console
      console.log('🚀 Development mode: Bypassing authentication for testing');

      const paymentId = params.id;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          sticker: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        payment,
        devBypass: true,
      });
    }

    // Normal authentication flow
    if (!session) {
      return NextResponse.json({ error: 'No authenticated' }, { status: 401 });
    }

    if (!session.user?.email) {
      return NextResponse.json(
        { error: 'No user email found' },
        { status: 401 }
      );
    }

    // Get user and check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if user has permission to view orders (which includes payments)
    if (!hasPermission(user.role, 'canManageOrders')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const paymentId = params.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        sticker: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
