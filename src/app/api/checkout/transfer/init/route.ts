import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/slug';
import { checkoutSchema } from '@/lib/validators';

const bodySchema = checkoutSchema;

export async function POST(req: Request) {
  console.log('💳 Starting checkout transfer initialization');
  try {
    const json = await req.json();
    console.log('📥 Received checkout data:', {
      email: json.email,
      nameOnSticker: json.nameOnSticker,
      flagCode: json.flagCode,
      quantity: json.quantity,
    });

    const data = bodySchema.parse(json);
    console.log('✅ Checkout data validation passed');

    // Create or find user by email
    console.log('🔍 Creating or finding user:', data.email);
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: { email: data.email },
      update: {},
    });
    console.log('✅ User ready:', { id: user.id, email: user.email });

    // Create Sticker (ORDERED) and Payment (PENDING) with reference
    const reference = `SAFETAP-${generateSlug(6)}`;
    console.log('🔖 Generated reference:', reference);

    console.log('💾 Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      const stickerSlug = generateSlug(7);
      const stickerSerial = `STK-${generateSlug(8)}`;

      console.log('🏷️ Creating sticker:', {
        slug: stickerSlug,
        serial: stickerSerial,
      });
      const sticker = await tx.sticker.create({
        data: {
          slug: stickerSlug,
          serial: stickerSerial,
          ownerId: user.id,
          nameOnSticker: data.nameOnSticker,
          flagCode: data.flagCode,
          colorPresetId: data.colorPresetId || 'light-gray',
          stickerColor: data.stickerColor || '#f1f5f9',
          textColor: data.textColor || '#000000',
          status: 'ORDERED',
        },
      });

      const amountCents = 699000 * data.quantity; // $6,990 CLP in cents
      console.log('💰 Creating payment:', {
        amount: amountCents,
        currency: 'CLP',
        reference,
        method: 'BANK_TRANSFER',
      });

      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          stickerId: sticker.id,
          amountCents,
          currency: 'CLP',
          method: 'BANK_TRANSFER',
          reference,
          status: 'PENDING',
        },
      });
      return { sticker, payment };
    });

    console.log('✅ Transaction completed successfully:', {
      stickerId: result.sticker.id,
      paymentId: result.payment.id,
      reference,
    });

    return NextResponse.json({ reference, paymentId: result.payment.id });
  } catch (e: unknown) {
    console.error('❌ Checkout initialization failed:', e);
    if (e instanceof z.ZodError) {
      console.log('📋 Validation error details:', e.issues);
      return NextResponse.json(
        { error: e.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
