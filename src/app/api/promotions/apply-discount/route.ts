import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDiscount, type PromotionRule } from '@/utils/promotions';

// Validation schema for the request
const applyDiscountSchema = z.object({
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
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { cart } = applyDiscountSchema.parse(body);

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

    // Convert database promotions to our PromotionRule format
    const promotionRules: PromotionRule[] = dbPromotions.map((promo) => ({
      id: promo.id,
      minQuantity: promo.minQuantity,
      discountType:
        promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
      discountValue: Number(promo.discountValue),
      description: promo.description || promo.name,
      active: promo.active,
    }));

    // Calculate discount using our utility function
    const discountResult = calculateDiscount(cart, promotionRules);

    // Log the promotion usage for analytics (optional)
    if (discountResult.appliedPromotions.length > 0) {
      console.log('Quantity-based promotion applied:', {
        userId: session.user.email,
        promotionId: discountResult.appliedPromotions[0].id,
        totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        discountAmount: discountResult.totalDiscount,
        originalTotal: discountResult.originalTotal,
        finalTotal: discountResult.finalTotal,
      });
    }

    return NextResponse.json({
      success: true,
      discount: discountResult,
    });
  } catch (error) {
    console.error('Error applying quantity discount:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available promotions for display
export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [
          {
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
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

    return NextResponse.json({
      promotions: promotions.map((promo) => ({
        ...promo,
        discountValue: Number(promo.discountValue),
      })),
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}
