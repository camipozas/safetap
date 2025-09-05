import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { formatCLPAmount } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get payments for the authenticated user
    const payments = await prisma.payment.findMany({
      where: {
        User: {
          email: session.user.email,
        },
      },
      include: {
        Sticker: {
          select: {
            id: true,
            slug: true,
            nameOnSticker: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format payments for frontend - usar el campo quantity directamente
    const formattedPayments = payments.map((payment) => {
      console.log('Payment debug:', {
        id: payment.id,
        amount: payment.amount,
        quantity: payment.quantity,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
      });

      // Formatear la referencia al estilo SAFETAP-2025-09-04-001
      let formattedReference = payment.reference;
      if (payment.reference && !payment.reference.startsWith('SAFETAP-')) {
        const date = payment.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        const shortId = payment.id.slice(-3); // Últimos 3 caracteres del ID
        formattedReference = `SAFETAP-${date}-${shortId}`;
      }

      // Usar el campo quantity del pago
      const quantity = payment.quantity || 1;
      let descripcion = 'Sticker SafeTap';

      if (payment.Sticker?.nameOnSticker) {
        if (quantity > 1) {
          descripcion = `${quantity} stickers para ${payment.Sticker.nameOnSticker}`;
        } else {
          descripcion = `${payment.Sticker.nameOnSticker} (${payment.Sticker.id.slice(-6)})`;
        }
      } else if (quantity > 1) {
        descripcion = `${quantity} stickers SafeTap`;
      }

      return {
        id: payment.id,
        fecha: payment.createdAt.toLocaleDateString('es-CL'),
        producto:
          formattedReference ||
          `SAFETAP-${payment.createdAt.toISOString().split('T')[0]}-${payment.id.slice(-3)}`,
        descripcion,
        monto: formatCLPAmount(payment.amount),
        estado: payment.status,
        cantidadStickers: quantity, // Usar el campo quantity directamente
        stickers: payment.Sticker
          ? [
              {
                id: payment.Sticker.id,
                slug: payment.Sticker.slug,
                name: payment.Sticker.nameOnSticker,
                status: payment.Sticker.status,
              },
            ]
          : [],
      };
    });

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
