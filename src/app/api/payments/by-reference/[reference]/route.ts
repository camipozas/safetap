import { NextResponse } from 'next/server';

import { PaymentReferenceService } from '@/lib/payment-reference-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { error: 'Referencia requerida' },
        { status: 400 }
      );
    }

    const payment = await PaymentReferenceService.findByReference(reference);

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
      user: {
        name: payment.User?.name,
        email: payment.User?.email,
        country: payment.User?.country,
      },
      sticker: payment.Sticker
        ? {
            nameOnSticker: payment.Sticker.nameOnSticker,
            flagCode: payment.Sticker.flagCode,
            status: payment.Sticker.status,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching payment by reference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
