import { NextResponse } from 'next/server';

import {
  DEFAULT_CURRENCY,
  PAYMENT_METHOD,
  PRICE_PER_STICKER_CLP,
} from '@/lib/constants';
import { applyDiscount } from '@/lib/discounts/applyDiscount';
import { shouldReuseEmergencyProfile } from '@/lib/emergency-profile-service';
import { PaymentReferenceService } from '@/lib/payment-reference-service';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/slug';
import { multiStickerCheckoutSchema } from '@/lib/validators';

export async function POST(req: Request) {
  console.log('💳 Starting multi-sticker checkout transfer initialization');
  try {
    const json = await req.json();
    console.log('📥 RAW REQUEST BODY:', JSON.stringify(json, null, 2));
    console.log('📥 Received multi-sticker checkout data:', {
      email: json.email,
      stickersCount: json.stickers?.length,
      tempReference: json.tempReference,
      discountCode: json.discountCode,
      stickersFullArray: json.stickers, // Log full array
    });

    const data = multiStickerCheckoutSchema.parse(json);
    console.log('✅ Multi-sticker checkout data validation passed');

    // Create or find user by email
    console.log('🔍 Creating or finding user:', data.email);

    // First, check if user exists to determine whether to update name
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true },
    });

    // Use the first sticker's name for user creation/update if no existing name
    const primaryStickerName = data.stickers[0].nameOnSticker;

    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: primaryStickerName,
        country: data.stickers[0].flagCode,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
      update: {
        // Only update name if user doesn't have one yet
        ...(existingUser && !existingUser.name && { name: primaryStickerName }),
        updatedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    console.log('👤 User resolved:', { id: user.id, name: user.name });

    // Calculate pricing
    const quantity = data.stickers.length;
    const baseAmount = quantity * PRICE_PER_STICKER_CLP;
    let finalAmount = baseAmount;
    let discountCodeId: string | undefined;
    let discountAmount = 0;

    // Apply discount if provided
    if (data.discountCode) {
      console.log('🎫 Applying discount code:', data.discountCode);
      const discountResult = await applyDiscount({
        code: data.discountCode,
        cartTotal: baseAmount,
        userId: user.id,
        preview: false, // This will increment usage count and create redemption
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

    // Generate unique payment reference or use temp reference
    let reference: string;
    if (data.tempReference) {
      // Validate that the temporary reference doesn't already exist in database
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
          `${quantity} Stickers personalizados`
        );
      } else {
        reference = data.tempReference;
        console.log('🔖 Using temporary reference:', reference);
      }
    } else {
      reference = await PaymentReferenceService.generateUniqueReference(
        user.id,
        finalAmount,
        `${quantity} Stickers personalizados`
      );
      console.log('🔖 Generated unique reference:', reference);
    }

    console.log('� Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      // Create all stickers
      const stickers = await Promise.all(
        data.stickers.map(async (stickerData) => {
          const stickerSlug = generateSlug(7);
          const stickerSerial = `STK-${generateSlug(8)}`;

          console.log('🏷️ Creating sticker:', {
            name: stickerData.nameOnSticker,
            slug: stickerSlug,
            serial: stickerSerial,
          });

          return await tx.sticker.create({
            data: {
              id: crypto.randomUUID(),
              slug: stickerSlug,
              serial: stickerSerial,
              ownerId: user.id,
              nameOnSticker: stickerData.nameOnSticker,
              flagCode: stickerData.flagCode,
              colorPresetId: stickerData.colorPresetId || 'light-gray',
              stickerColor: stickerData.stickerColor || '#f1f5f9',
              textColor: stickerData.textColor || '#000000',
              status: 'ORDERED',
              updatedAt: new Date(),
            },
          });
        })
      );

      // Optimize emergency profile creation
      // Instead of creating N profiles for N stickers, check if user should reuse existing profile
      const shouldReuse = await shouldReuseEmergencyProfile(user.id);

      if (shouldReuse) {
        console.log(
          '✅ User has existing emergency profile - will reuse instead of duplicating'
        );

        // Find the most recent profile to reference
        const existingProfile = await tx.emergencyProfile.findFirst({
          where: { userId: user.id },
          orderBy: { updatedByUserAt: 'desc' },
        });

        if (existingProfile) {
          console.log(
            `🔗 Will reference existing profile ${existingProfile.id} for new stickers`
          );
          // Note: Due to current schema constraints (unique stickerId),
          // we can't directly link multiple stickers to one profile.
          // This is handled at the application level when displaying emergency info.
        }
      } else {
        console.log(
          '🆕 User has no meaningful emergency profile - will create new ones as needed'
        );
      }

      console.log('💰 Creating payment for multiple stickers:', {
        amount: finalAmount,
        originalAmount: discountCodeId ? baseAmount : undefined,
        discountAmount: discountCodeId ? discountAmount : undefined,
        currency: DEFAULT_CURRENCY,
        reference,
        method: PAYMENT_METHOD,
        stickersCount: stickers.length,
        quantity: stickers.length, // Add explicit quantity logging
      });

      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          stickerId: stickers[0].id, // Primary sticker for payment reference
          quantity: stickers.length,
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

      console.log('✅ Payment created successfully:', {
        paymentId: payment.id,
        quantity: payment.quantity,
        amount: payment.amount,
        reference: payment.reference,
      });

      return { stickers, payment };
    });

    console.log('✅ Transaction completed successfully:', {
      stickersCount: result.stickers.length,
      paymentId: result.payment.id,
      reference,
    });

    return NextResponse.json({
      reference,
      paymentId: result.payment.id,
      stickersCount: result.stickers.length,
      stickers: result.stickers.map((sticker) => ({
        id: sticker.id,
        name: sticker.nameOnSticker,
        flagCode: sticker.flagCode,
        slug: sticker.slug,
      })),
    });
  } catch (e: unknown) {
    console.error('❌ Multi-sticker checkout initialization failed:', e);
    if (e instanceof Error && e.constructor.name === 'ZodError') {
      console.log('📋 Validation error details:', e.message);
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
