import { NextResponse } from 'next/server';

import { PaymentReferenceService } from '@/lib/payment-reference-service';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        reference: true,
        amount: true,
        status: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        Sticker: {
          select: {
            nameOnSticker: true,
            flagCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const testReference = await PaymentReferenceService.generateUniqueReference(
      'test-user-id',
      15000,
      'Test Sticker'
    );

    return NextResponse.json({
      message: 'Payment references test',
      existingPayments: payments,
      testReference,
      totalPayments: await prisma.payment.count(),
    });
  } catch (error) {
    console.error('Error testing references:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
