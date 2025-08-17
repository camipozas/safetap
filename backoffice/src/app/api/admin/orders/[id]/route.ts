import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !hasPermission(session.user.role, 'canManageOrders')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
            amountCents: true,
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
