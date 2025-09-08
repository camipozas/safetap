import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { calculateDiscount, type PromotionRule } from '@/utils/promotions';

// Validation schema for the request
const previewDiscountSchema = z.object({
  cart: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        quantity: z.number().positive().int(),
      })
    )
    .min(1, 'Cart cannot be empty'),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedData = previewDiscountSchema.parse(body);

    // Fetch active promotions from database
    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        // Only include promotions that are currently valid
        OR: [
          {
            AND: [
              { startDate: { lte: new Date() } },
              { endDate: { gte: new Date() } },
            ],
          },
          {
            AND: [{ startDate: null }, { endDate: null }],
          },
          {
            AND: [{ startDate: { lte: new Date() } }, { endDate: null }],
          },
          {
            AND: [{ startDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { minQuantity: 'asc' }],
    });

    // Convert database promotions to PromotionRule format
    const promotionRules: PromotionRule[] = promotions.map((promo) => ({
      id: promo.id,
      minQuantity: promo.minQuantity,
      discountType: promo.discountType.toLowerCase() as 'percentage' | 'fixed',
      discountValue: Number(promo.discountValue),
      description: promo.description || promo.name,
      active: promo.active,
    }));

    // Calculate discount using the promotion rules from database
    const discountResult = calculateDiscount(
      validatedData.cart,
      promotionRules
    );

    return NextResponse.json(discountResult);
  } catch (error) {
    console.error('Error calculating discount preview:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return available promotion tiers for display
    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date() } },
              { endDate: { gte: new Date() } },
            ],
          },
          {
            AND: [{ startDate: null }, { endDate: null }],
          },
          {
            AND: [{ startDate: { lte: new Date() } }, { endDate: null }],
          },
          {
            AND: [{ startDate: null }, { endDate: { gte: new Date() } }],
          },
        ],
      },
      orderBy: [{ minQuantity: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        minQuantity: true,
        discountType: true,
        discountValue: true,
      },
    });

    const promotionTiers = promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      description: promo.description || promo.name,
      minQuantity: promo.minQuantity,
      discountType: promo.discountType.toLowerCase(),
      discountValue: Number(promo.discountValue),
    }));

    return NextResponse.json({ promotions: promotionTiers });
  } catch (error) {
    console.error('Error fetching promotion preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
