import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
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
        user: {
          email: session.user.email,
        },
      },
      include: {
        sticker: {
          select: {
            slug: true,
            nameOnSticker: true,
            status: true, // Incluir el estado del sticker
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format payments for frontend
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      fecha: payment.createdAt.toLocaleDateString('es-CL'),
      producto: 'Sticker SafeTap',
      monto: `$${payment.amount.toLocaleString('es-CL')} ${payment.currency}`,
      estado: payment.status,
      stickerSlug: payment.sticker?.slug,
      stickerName: payment.sticker?.nameOnSticker,
      stickerStatus: payment.sticker?.status, // Incluir el estado del sticker
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
