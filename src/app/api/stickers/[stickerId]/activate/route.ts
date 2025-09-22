import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Activate a sticker
 * @param request - The request body
 * @param params - The parameters
 * @returns - The response body
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stickerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stickerId } = await params;

    const sticker = await prisma.sticker.findFirst({
      where: {
        id: stickerId,
        User: {
          email: session.user.email,
        },
      },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!sticker) {
      return NextResponse.json(
        { error: 'Sticker no encontrado' },
        { status: 404 }
      );
    }

    const validPayment = sticker.Payment.find(
      (payment) => payment.status === 'VERIFIED' || payment.status === 'PAID'
    );

    if (!validPayment) {
      return NextResponse.json(
        {
          error:
            'El sticker debe tener un pago verificado antes de poder activarse',
        },
        { status: 400 }
      );
    }

    if (sticker.status !== 'SHIPPED') {
      return NextResponse.json(
        {
          error:
            'El sticker debe estar en estado "Enviado" para poder activarse',
        },
        { status: 400 }
      );
    }

    await prisma.sticker.update({
      where: { id: stickerId },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating sticker:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
