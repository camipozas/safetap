import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../../../../../lib/auth';
import { isValidStatusTransition } from '../../../../../../lib/order-helpers';
import { prisma } from '../../../../../../lib/prisma';

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

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
          (p) => p.status === 'VERIFIED' || p.status === 'PAID'
        ),
        hasPendingPayment: order.Payment.some((p) => p.status === 'PENDING'),
        hasRejectedPayment: order.Payment.some((p) => p.status === 'REJECTED'),
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
    if (newStatus === 'REJECTED') {
      // Para rechazar, actualizamos el pago pero NO el sticker
      // (el sticker mantiene su estado actual, típicamente ORDERED)
      if (order.Payment.length > 0) {
        // Get the latest payment (already ordered by createdAt desc)
        const latestPayment = order.Payment[0];
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: { status: 'REJECTED' },
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
    if (newStatus === 'PAID') {
      if (order.Payment.length === 0) {
        // Crear un nuevo pago si no existe
        await prisma.payment.create({
          data: {
            userId: order.ownerId,
            stickerId: id,
            amount: 6990, // Precio estándar del sticker
            currency: 'CLP',
            reference: `STK-${id}-${Date.now()}`,
            status: 'VERIFIED',
          } as any,
        });
      } else {
        // Actualizar el pago más reciente
        const latestPayment = order.Payment[0];
        if (latestPayment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { status: 'VERIFIED' },
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
