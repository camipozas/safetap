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

    // Format payments for frontend
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      fecha: payment.createdAt.toLocaleDateString('es-CL'),
      producto: 'Sticker SafeTap',
      monto: formatCLPAmount(payment.amount),
      estado: payment.status,
      stickerSlug: payment.Sticker?.slug,
      stickerName: payment.Sticker?.nameOnSticker,
      stickerStatus: payment.Sticker?.status,
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
