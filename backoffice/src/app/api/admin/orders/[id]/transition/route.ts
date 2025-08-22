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
        payments: {
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
        hasConfirmedPayment: order.payments.some(
          (p) => p.status === 'VERIFIED' || p.status === 'PAID'
        ),
        hasPendingPayment: order.payments.some((p) => p.status === 'PENDING'),
        hasRejectedPayment: order.payments.some((p) => p.status === 'REJECTED'),
        totalAmount: order.payments.reduce((sum, p) => sum + p.amountCents, 0),
        currency: order.payments[0]?.currency || 'EUR',
        latestStatus: (order.payments[0]?.status as any) || null,
        paymentCount: order.payments.length,
      })
    ) {
      return NextResponse.json(
        { error: 'Transición de estado no válida' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la orden
    const updatedOrder = await prisma.sticker.update({
      where: { id },
      data: { status: newStatus },
      include: {
        payments: true,
      },
    });

    // Manejar pagos según el estado
    if (newStatus === 'PAID') {
      if (order.payments.length === 0) {
        // Crear un nuevo pago si no existe
        await prisma.payment.create({
          data: {
            userId: order.ownerId,
            stickerId: id,
            amountCents: 6990, // Precio estándar del sticker
            currency: 'CLP',
            reference: `STK-${id}-${Date.now()}`,
            status: 'VERIFIED',
          },
        });
      } else {
        // Actualizar el pago más reciente
        const latestPayment = order.payments[0];
        if (latestPayment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { status: 'VERIFIED' },
          });
        }
      }
    }

    // Si la orden pasa a REJECTED, crear o actualizar el pago como rechazado
    if (newStatus === 'REJECTED') {
      if (order.payments.length === 0) {
        // Crear un nuevo pago rechazado si no existe
        await prisma.payment.create({
          data: {
            userId: order.ownerId,
            stickerId: id,
            amountCents: 6990, // Precio estándar del sticker
            currency: 'CLP',
            reference: `STK-${id}-REJ-${Date.now()}`,
            status: 'REJECTED',
          },
        });
      } else {
        // Actualizar el pago más reciente
        const latestPayment = order.payments[0];
        if (latestPayment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: latestPayment.id },
            data: { status: 'REJECTED' },
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
