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
import { calculateDiscount } from '@/utils/promotions';

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

    // Calculate pricing with automatic quantity discounts
    const quantity = data.stickers.length;
    const baseAmount = quantity * PRICE_PER_STICKER_CLP;
    let finalAmount = baseAmount;
    let discountCodeId: string | undefined;
    let discountAmount = 0;

    // First, apply automatic quantity-based promotions
    console.log(
      '🛒 Calculating automatic quantity discounts for',
      quantity,
      'stickers'
    );

    // Fetch active promotions from database
    const dbPromotions = await prisma.promotion.findMany({
      where: {
        active: true,
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { minQuantity: 'desc' }],
    });

    // Convert database promotions to our PromotionRule format and calculate discount
    let appliedPromotionId: string | undefined;
    if (dbPromotions.length > 0) {
      const promotionRules = dbPromotions.map((promo) => ({
        id: promo.id,
        minQuantity: promo.minQuantity,
        discountType:
          promo.discountType === 'PERCENTAGE'
            ? ('percentage' as const)
            : ('fixed' as const),
        discountValue: Number(promo.discountValue),
        description: promo.description || promo.name,
        active: promo.active,
      }));

      // Create a cart item for discount calculation
      const cartItems = [
        {
          id: 'sticker',
          name: 'Sticker personalizado',
          price: PRICE_PER_STICKER_CLP,
          quantity,
        },
      ];

      const quantityDiscountResult = calculateDiscount(
        cartItems,
        promotionRules
      );

      if (quantityDiscountResult.totalDiscount > 0) {
        finalAmount = quantityDiscountResult.finalTotal;
        discountAmount = quantityDiscountResult.totalDiscount;
        appliedPromotionId = quantityDiscountResult.appliedPromotions[0]?.id;
        console.log('✅ Automatic quantity discount applied:', {
          originalAmount: baseAmount,
          discountAmount,
          finalAmount,
          promotionId: appliedPromotionId,
          promotion: quantityDiscountResult.appliedPromotions[0]?.description,
        });
      }
    }

    // Then, apply manual discount code if provided (this can stack or override)
    if (data.discountCode) {
      console.log('🎫 Applying additional discount code:', data.discountCode);
      const discountResult = await applyDiscount({
        code: data.discountCode,
        cartTotal: finalAmount, // Apply discount code to already discounted amount
        userId: user.id,
        preview: false, // This will increment usage count and create redemption
      });

      if (discountResult.valid && discountResult.newTotal !== undefined) {
        // Add the manual discount to the existing automatic discount
        const additionalDiscount = finalAmount - discountResult.newTotal;
        finalAmount = discountResult.newTotal;
        discountAmount += additionalDiscount;
        discountCodeId = discountResult.discountCodeId;
        console.log('✅ Manual discount code applied:', {
          additionalDiscount,
          totalDiscountAmount: discountAmount,
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

    console.log('📊 Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      // Create all stickers
      // Generate a single groupId only for batch purchases (2+ stickers)
      const isBatchPurchase = quantity >= 2;
      const purchaseGroupId = isBatchPurchase ? crypto.randomUUID() : null;

      console.log('🛒 Purchase type:', {
        quantity,
        isBatchPurchase,
        groupId: purchaseGroupId,
      });

      const stickers = await Promise.all(
        data.stickers.map(async (stickerData) => {
          const stickerSlug = generateSlug(7);
          const stickerSerial = `STK-${generateSlug(8)}`;

          console.log('🏷️ Creating sticker:', {
            name: stickerData.nameOnSticker,
            slug: stickerSlug,
            serial: stickerSerial,
            groupId: purchaseGroupId,
            isBatch: isBatchPurchase,
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
              groupId: purchaseGroupId, // Only batch purchases (2+ stickers) get a groupId
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
        originalAmount: discountAmount > 0 ? baseAmount : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        currency: DEFAULT_CURRENCY,
        reference,
        method: PAYMENT_METHOD,
        stickersCount: stickers.length,
        quantity: stickers.length, // Add explicit quantity logging
      });

      // Create ONE payment for the entire purchase
      // For batch orders, the payment represents the TOTAL amount, not per-sticker
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          stickerId: stickers[0].id, // Primary sticker for payment reference
          quantity: stickers.length, // Total quantity in this payment
          amount: finalAmount, // TOTAL amount for entire batch
          originalAmount: discountAmount > 0 ? baseAmount : undefined, // TOTAL original amount (only if discount applied)
          discountCodeId,
          promotionId: appliedPromotionId, // Store which promotion was applied
          discountAmount: discountAmount > 0 ? discountAmount : undefined, // TOTAL discount amount (includes both automatic and manual)
          currency: DEFAULT_CURRENCY,
          method: PAYMENT_METHOD,
          reference, // Single reference for the entire batch
          status: 'PENDING',
          updatedAt: new Date(),
        },
      });

      // Create PromotionRedemption record if an automatic promotion was applied
      if (appliedPromotionId) {
        await tx.promotionRedemption.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            promotionId: appliedPromotionId,
            appliedAt: new Date(),
          },
        });
        console.log(
          '📝 Created PromotionRedemption record for automatic promotion:',
          appliedPromotionId
        );
      }

      console.log('✅ Payment created successfully:', {
        paymentId: payment.id,
        quantity: payment.quantity,
        amount: payment.amount,
        reference: payment.reference,
        isBatch: stickers.length > 1,
        totalAmount: finalAmount,
        originalAmount: discountAmount > 0 ? baseAmount : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        hasAutomaticDiscount: discountAmount > 0 && !discountCodeId,
        hasManualDiscountCode: !!discountCodeId,
      });

      // NOTE: For batch orders, only the first sticker has a payment record.
      // The other stickers in the batch are linked by groupId and don't have individual payments.
      // This avoids confusion and ensures the total amount is counted only once.

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
