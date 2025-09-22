import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  DEFAULT_CURRENCY,
  PAYMENT_METHOD,
  PRICE_PER_STICKER_CLP,
} from '@/lib/constants';
import { applyDiscount } from '@/lib/discounts/applyDiscount';
import { PaymentReferenceService } from '@/lib/payment-reference-service';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/slug';
import { checkoutSchema } from '@/lib/validators';

const bodySchema = checkoutSchema.extend({
  discountCode: z.string().optional(),
  tempReference: z.string().optional(),
});

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

    console.log('🔍 Creating or finding user:', data.email);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true },
    });

    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.nameOnSticker,
        country: data.flagCode,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
      update: {
        ...(existingUser?.name ? {} : { name: data.nameOnSticker }),
        country: data.flagCode,
        updatedAt: new Date(),
      },
    });
    console.log('✅ User ready:', {
      id: user.id,
      email: user.email,
      name: user.name,
      country: user.country,
    });

    const baseAmount = PRICE_PER_STICKER_CLP * data.quantity;

    let discountResult = null;
    let finalAmount = baseAmount;
    let discountCodeId: string | null | undefined = null;
    let discountAmount = 0;

    if (data.discountCode) {
      console.log('🎫 Applying discount code:', data.discountCode);
      discountResult = await applyDiscount({
        code: data.discountCode,
        cartTotal: baseAmount,
        userId: user.id,
        preview: false,
      });

      if (discountResult.valid && discountResult.newTotal !== undefined) {
        finalAmount = discountResult.newTotal;
        discountCodeId = discountResult.discountCodeId;
        discountAmount = discountResult.appliedDiscount || 0;
        console.log('✅ Discount applied:', {
          code: data.discountCode,
          discountAmount,
          finalAmount,
        });
      } else {
        console.log('❌ Invalid discount code:', discountResult.message);
        return NextResponse.json(
          { error: discountResult.message || 'Código de descuento inválido' },
          { status: 400 }
        );
      }
    }

    let reference: string;
    if (data.tempReference) {
      const existingPayment = await prisma.payment.findUnique({
        where: { reference: data.tempReference },
      });

      if (existingPayment) {
        console.log(
          '⚠️ Temporary reference already exists, generating new one'
        );
        reference = await PaymentReferenceService.generateUniqueReference(
          user.id,
          finalAmount,
          `Sticker ${data.nameOnSticker}`
        );
      } else {
        reference = data.tempReference;
        console.log('🔖 Using temporary reference:', reference);
      }
    } else {
      reference = await PaymentReferenceService.generateUniqueReference(
        user.id,
        finalAmount,
        `Sticker ${data.nameOnSticker}`
      );
      console.log('🔖 Generated unique reference:', reference);
    }

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
          id: crypto.randomUUID(),
          slug: stickerSlug,
          serial: stickerSerial,
          ownerId: user.id,
          nameOnSticker: data.nameOnSticker,
          flagCode: data.flagCode,
          colorPresetId: data.colorPresetId || 'light-gray',
          stickerColor: data.stickerColor || '#f1f5f9',
          textColor: data.textColor || '#000000',
          status: 'ORDERED',
          groupId: null,
          updatedAt: new Date(),
        },
      });

      console.log('💰 Creating payment:', {
        amount: finalAmount,
        originalAmount: discountCodeId ? baseAmount : undefined,
        discountAmount: discountCodeId ? discountAmount : undefined,
        currency: DEFAULT_CURRENCY,
        reference,
        method: PAYMENT_METHOD,
      });

      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          stickerId: sticker.id,
          quantity: 1,
          amount: finalAmount,
          originalAmount: discountCodeId ? baseAmount : undefined,
          discountCodeId,
          discountAmount: discountCodeId ? discountAmount : undefined,
          currency: DEFAULT_CURRENCY,
          method: PAYMENT_METHOD,
          reference,
          status: 'PENDING',
          updatedAt: new Date(),
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
