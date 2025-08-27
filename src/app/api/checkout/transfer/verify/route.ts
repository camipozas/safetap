import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const verifyTransferSchema = z.object({
  reference: z.string().min(1, 'Referencia requerida'),
  transferConfirmed: z.boolean(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  console.log('🔍 Starting transfer payment verification');

  try {
    const json = await req.json();
    console.log('📥 Received verification data:', {
      reference: json.reference,
      transferConfirmed: json.transferConfirmed,
    });

    const data = verifyTransferSchema.parse(json);
    console.log('✅ Verification data validation passed');

    // Find the payment by reference
    console.log('🔍 Looking for payment with reference:', data.reference);
    const payment = await prisma.payment.findUnique({
      where: { reference: data.reference },
      include: {
        Sticker: true,
        User: true,
      },
    });

    if (!payment) {
      console.log('❌ Payment not found for reference:', data.reference);
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    if (payment.status !== 'PENDING') {
      console.log('❌ Payment not in PENDING status:', payment.status);
      return NextResponse.json(
        { error: `El pago ya fue procesado con estado: ${payment.status}` },
        { status: 400 }
      );
    }

    console.log('💾 Starting payment verification transaction...');

    const result = await prisma.$transaction(async (tx) => {
      // Update payment status based on confirmation
      const newStatus = data.transferConfirmed ? 'PAID' : 'REJECTED';
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          receivedAt: data.transferConfirmed ? new Date() : null,
        },
      });

      let updatedSticker = payment.Sticker;
      let updatedUser = payment.User;

      // If transfer payment is confirmed, mark sticker as PAID and update user totalSpent
      if (data.transferConfirmed && payment.Sticker) {
        console.log(
          '✅ Transfer payment confirmed, updating sticker to PAID:',
          payment.Sticker.id
        );
        updatedSticker = await tx.sticker.update({
          where: { id: payment.Sticker.id },
          data: {
            status: 'PAID',
          },
        });

        // Update user's totalSpent
        console.log(
          '💰 Updating user totalSpent by:',
          payment.amount,
          'for user:',
          payment.User.email
        );
        updatedUser = await tx.user.update({
          where: { id: payment.userId },
          data: {
            totalSpent: (payment.User.totalSpent || 0) + payment.amount,
          },
        });
      }

      return {
        payment: updatedPayment,
        sticker: updatedSticker,
        user: updatedUser,
      };
    });

    console.log('✅ Payment verification completed:', {
      paymentId: result.payment.id,
      status: result.payment.status,
      stickerStatus: result.sticker?.status,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: result.payment.id,
        status: result.payment.status,
        reference: result.payment.reference,
        receivedAt: result.payment.receivedAt,
      },
      sticker: result.sticker
        ? {
            id: result.sticker.id,
            status: result.sticker.status,
            slug: result.sticker.slug,
            serial: result.sticker.serial,
          }
        : null,
      message: data.transferConfirmed
        ? 'Transferencia confirmada y sticker activado correctamente'
        : 'Pago rechazado',
    });
  } catch (e: unknown) {
    console.error('❌ Transfer verification failed:', e);

    if (e instanceof z.ZodError) {
      console.log('📋 Validation error details:', e.issues);
      return NextResponse.json(
        { error: e.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET endpoint to check payment status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'Referencia requerida' },
      { status: 400 }
    );
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        Sticker: {
          select: {
            id: true,
            status: true,
            slug: true,
            serial: true,
          },
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        receivedAt: payment.receivedAt,
        createdAt: payment.createdAt,
      },
      sticker: payment.stickerId,
      user: payment.User,
    });
  } catch (e: unknown) {
    console.error('❌ Payment status check failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
