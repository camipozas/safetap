import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../../../lib/auth';
import {
  ORDER_STATUS,
  isValidStatusTransition,
} from '../../../../../../lib/order-helpers';
import { prisma } from '../../../../../../lib/prisma';
import { PaymentStatus, USER_ROLES } from '../../../../../../types/shared';

/**
 * PUT - Transition order status
 * @param request - The request object
 * @param params - The parameters object
 * @returns - The response object
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (
      !user ||
      (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { newStatus, updatePayment = false } = await request.json();

    const order = await prisma.sticker.findUnique({
      where: { id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    if (
      !isValidStatusTransition(order.status, newStatus, {
        hasConfirmedPayment: order.Payment.some(
          (p) =>
            p.status === PaymentStatus.VERIFIED ||
            p.status === PaymentStatus.PAID
        ),
        hasPendingPayment: order.Payment.some(
          (p) => p.status === PaymentStatus.PENDING
        ),
        hasRejectedPayment: order.Payment.some(
          (p) => p.status === PaymentStatus.REJECTED
        ),
        totalAmount: order.Payment.reduce((sum, p) => sum + p.amount, 0),
        currency: order.Payment[0]?.currency || 'EUR',
        latestStatus: order.Payment[0]?.status || null,
        paymentCount: order.Payment.length,
      })
    ) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    if (newStatus === ORDER_STATUS.REJECTED) {
      if (order.Payment.length > 0) {
        const latestPayment = order.Payment[0];
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: PaymentStatus.REJECTED },
        });
      }

      const orderWithRejectedPayment = await prisma.sticker.findUnique({
        where: { id },
        include: {
          Payment: true,
        },
      });

      return NextResponse.json({
        success: true,
        order: orderWithRejectedPayment,
        message: 'Pago rechazado correctamente',
      });
    }

    const updatedOrder = await prisma.sticker.update({
      where: { id },
      data: { status: newStatus },
      include: {
        Payment: true,
      },
    });

    if (newStatus === ORDER_STATUS.PAID) {
      if (order.Payment.length === 0) {
        await prisma.payment.create({
          data: {
            id: crypto.randomUUID(),
            userId: order.ownerId,
            stickerId: id,
            quantity: 1,
            amount: 6990,
            currency: 'CLP',
            reference: `STK-${id}-${Date.now()}`,
            status: PaymentStatus.VERIFIED,
            updatedAt: new Date(),
          },
        });
      } else {
        const latestPayment = order.Payment[0];
        if (latestPayment.status === PaymentStatus.PENDING) {
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { status: PaymentStatus.VERIFIED },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Orden actualizada a estado: ${newStatus}`,
    });
  } catch (error) {
    console.error('Error en transición de estado:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
