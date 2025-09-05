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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos de admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (
      !user ||
      (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.SUPER_ADMIN)
    ) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const { newStatus, updatePayment = false } = await request.json();

    // Validar que la orden existe
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

    // Validar la transición de estado
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
        latestStatus: (order.Payment[0]?.status as any) || null,
        paymentCount: order.Payment.length,
      })
    ) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Manejar caso especial de rechazo
    if (newStatus === ORDER_STATUS.REJECTED) {
      // Para rechazar, actualizamos el pago pero NO el sticker
      // (el sticker mantiene su estado actual, típicamente ORDERED)
      if (order.Payment.length > 0) {
        // Get the latest payment (already ordered by createdAt desc)
        const latestPayment = order.Payment[0];
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: PaymentStatus.REJECTED },
        });
      }

      // Devolver la orden sin cambiar el estado del sticker
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

    // Para otros estados, actualizar el estado del sticker normalmente
    const updatedOrder = await prisma.sticker.update({
      where: { id },
      data: { status: newStatus },
      include: {
        Payment: true,
      },
    });

    // Manejar pagos según el estado
    if (newStatus === ORDER_STATUS.PAID) {
      if (order.Payment.length === 0) {
        // Crear un nuevo pago si no existe
        await prisma.payment.create({
          data: {
            id: crypto.randomUUID(),
            userId: order.ownerId,
            stickerId: id,
            quantity: 1, // Un sticker por defecto en el backoffice
            amount: 6990, // Precio estándar del sticker
            currency: 'CLP',
            reference: `STK-${id}-${Date.now()}`,
            status: PaymentStatus.VERIFIED,
            updatedAt: new Date(),
          },
        });
      } else {
        // Actualizar el pago más reciente
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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
