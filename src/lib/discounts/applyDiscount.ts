import { DiscountType } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface DiscountValidationResult {
  valid: boolean;
  type?: DiscountType;
  amount?: number;
  appliedDiscount?: number;
  newTotal?: number;
  message?: string;
  discountCodeId?: string;
}

export interface ApplyDiscountParams {
  code: string;
  cartTotal: number;
  userId?: string;
  preview?: boolean; // If true, don't increment usage count
}

/**
 * Validates and applies a discount code to a cart total
 * Server-side validation with all business rules
 */
export async function applyDiscount({
  code,
  cartTotal,
  userId,
  preview = true,
}: ApplyDiscountParams): Promise<DiscountValidationResult> {
  try {
    // Normalize code to uppercase and trim
    const normalizedCode = code.trim().toUpperCase();

    // Find the discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
      select: {
        id: true,
        type: true,
        amount: true,
        active: true,
        expiresAt: true,
        maxRedemptions: true,
        usageCount: true,
      },
    });

    // Code doesn't exist
    if (!discountCode) {
      return {
        valid: false,
        message: 'Código de descuento no válido',
      };
    }

    // Code is inactive
    if (!discountCode.active) {
      return {
        valid: false,
        message: 'Código de descuento desactivado',
      };
    }

    // Code has expired
    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return {
        valid: false,
        message: 'Código de descuento expirado',
      };
    }

    // Check usage limits
    if (
      discountCode.maxRedemptions &&
      discountCode.usageCount >= discountCode.maxRedemptions
    ) {
      return {
        valid: false,
        message: 'Código de descuento agotado',
      };
    }

    // Calculate discount amount
    let appliedDiscount = 0;
    const discountAmount = Number(discountCode.amount);

    if (discountCode.type === 'PERCENT') {
      // Percentage discount (0-100)
      if (discountAmount > 100) {
        return {
          valid: false,
          message: 'Configuración de descuento inválida',
        };
      }
      appliedDiscount = Math.round(cartTotal * (discountAmount / 100));
    } else if (discountCode.type === 'FIXED') {
      // Fixed amount discount
      appliedDiscount = Math.min(discountAmount, cartTotal);
    }

    // Calculate new total (never below 0)
    const newTotal = Math.max(0, cartTotal - appliedDiscount);

    // If not preview mode, increment usage count
    if (!preview && userId) {
      await prisma.$transaction(async (tx) => {
        // Increment usage count
        await tx.discountCode.update({
          where: { id: discountCode.id },
          data: { usageCount: { increment: 1 } },
        });

        // Create redemption record
        await tx.discountRedemption.create({
          data: {
            discountCodeId: discountCode.id,
            userId,
            redeemedAt: new Date(),
          },
        });
      });
    }

    return {
      valid: true,
      type: discountCode.type,
      amount: discountAmount,
      appliedDiscount,
      newTotal,
      message: 'Código aplicado exitosamente',
      discountCodeId: discountCode.id,
    };
  } catch (error) {
    console.error('Error applying discount:', error);
    return {
      valid: false,
      message: 'Error al validar el código de descuento',
    };
  }
}

/**
 * Helper function to format discount for display
 */
export function formatDiscountForDisplay(
  result: DiscountValidationResult
): string {
  if (!result.valid || !result.type || !result.amount) {
    return '';
  }

  if (result.type === 'PERCENT') {
    return `${result.amount}% de descuento`;
  } else {
    return `$${result.amount.toLocaleString('es-CL')} de descuento`;
  }
}
