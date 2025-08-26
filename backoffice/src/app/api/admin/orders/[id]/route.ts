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
      const orderId = params.id;

      const validStatuses = [
        'ORDERED',
        'PAID',
        'PRINTING',
        'SHIPPED',
        'ACTIVE',
        'LOST',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
      }

      const updatedSticker = await prisma.sticker.update({
        where: { id: orderId },
        data: { status },
        include: {
          owner: {
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
        devBypass: true,
      });
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

    const validStatuses = [
      'ORDERED',
      'PAID',
      'PRINTING',
      'SHIPPED',
      'ACTIVE',
      'LOST',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    const updatedSticker = await prisma.sticker.update({
      where: { id: orderId },
      data: { status },
      include: {
        owner: {
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
    });
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
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            country: true,
          },
        },
        payments: {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
