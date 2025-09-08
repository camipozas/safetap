/**
 * Promotions utility functions for quantity-based discounts
 * Handles cart discount calculations with configurable rules
 */

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type DiscountResult = {
  totalDiscount: number;
  updatedCart: CartItem[];
  appliedPromotions: AppliedPromotion[];
  originalTotal: number;
  finalTotal: number;
};

export type PromotionRule = {
  id: string;
  minQuantity: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description: string;
  active: boolean;
};

export type AppliedPromotion = {
  id: string;
  description: string;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliedToQuantity: number;
};

// Default promotion rules - based on quantity tiers
const DEFAULT_PROMOTION_RULES: PromotionRule[] = [
  {
    id: 'bulk-2-plus',
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 10, // 10% off for 2+ items
    description: '10% de descuento por 2 o más stickers',
    active: true,
  },
  {
    id: 'bulk-5-plus',
    minQuantity: 5,
    discountType: 'percentage',
    discountValue: 15, // 15% off for 5+ items
    description: '15% de descuento por 5 o más stickers',
    active: true,
  },
  {
    id: 'bulk-10-plus',
    minQuantity: 10,
    discountType: 'percentage',
    discountValue: 20, // 20% off for 10+ items
    description: '20% de descuento por 10 o más stickers',
    active: true,
  },
];

/**
 * Calculate total quantity in cart
 */
function getTotalQuantity(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculate cart subtotal before discounts
 */
function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Find the best applicable promotion rule based on quantity
 * Returns the rule with highest discount value for given quantity
 */
function findBestPromotionRule(
  totalQuantity: number,
  rules: PromotionRule[] = DEFAULT_PROMOTION_RULES
): PromotionRule | null {
  const applicableRules = rules
    .filter((rule) => rule.active && totalQuantity >= rule.minQuantity)
    .sort((a, b) => {
      // Sort by minQuantity descending to get the highest tier first
      if (b.minQuantity !== a.minQuantity) {
        return b.minQuantity - a.minQuantity;
      }
      // If same minQuantity, prefer higher discount value
      return b.discountValue - a.discountValue;
    });

  return applicableRules[0] || null;
}

/**
 * Calculate discount amount based on promotion rule
 */
function calculateDiscountAmount(
  subtotal: number,
  rule: PromotionRule
): number {
  if (rule.discountType === 'percentage') {
    return Math.round(subtotal * (rule.discountValue / 100));
  } else {
    // Fixed discount
    return Math.min(rule.discountValue, subtotal);
  }
}

/**
 * Main function to calculate discounts for a cart
 * This function implements the core business logic for quantity-based discounts
 */
export function calculateDiscount(
  cart: CartItem[],
  customRules?: PromotionRule[]
): DiscountResult {
  if (!cart || cart.length === 0) {
    return {
      totalDiscount: 0,
      updatedCart: [],
      appliedPromotions: [],
      originalTotal: 0,
      finalTotal: 0,
    };
  }

  const validCart = cart.filter(
    (item) =>
      item.id &&
      item.name &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
  );

  if (validCart.length === 0) {
    return {
      totalDiscount: 0,
      updatedCart: cart,
      appliedPromotions: [],
      originalTotal: 0,
      finalTotal: 0,
    };
  }

  const rules = customRules || DEFAULT_PROMOTION_RULES;
  const totalQuantity = getTotalQuantity(validCart);
  const originalTotal = getCartSubtotal(validCart);

  // Find applicable promotion
  const applicableRule = findBestPromotionRule(totalQuantity, rules);

  if (!applicableRule) {
    // No promotion applies
    return {
      totalDiscount: 0,
      updatedCart: validCart,
      appliedPromotions: [],
      originalTotal,
      finalTotal: originalTotal,
    };
  }

  // Calculate discount
  const discountAmount = calculateDiscountAmount(originalTotal, applicableRule);
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  const appliedPromotion: AppliedPromotion = {
    id: applicableRule.id,
    description: applicableRule.description,
    discountAmount,
    discountType: applicableRule.discountType,
    discountValue: applicableRule.discountValue,
    appliedToQuantity: totalQuantity,
  };

  return {
    totalDiscount: discountAmount,
    updatedCart: validCart,
    appliedPromotions: [appliedPromotion],
    originalTotal,
    finalTotal,
  };
}

/**
 * Format discount for display in UI
 */
export function formatDiscountDisplay(discount: AppliedPromotion): string {
  if (discount.discountType === 'percentage') {
    return `${discount.discountValue}% de descuento`;
  } else {
    return `$${discount.discountValue.toLocaleString('es-CL')} de descuento`;
  }
}

/**
 * Get available promotion tiers for display
 */
export function getPromotionTiers(
  customRules?: PromotionRule[]
): PromotionRule[] {
  const rules = customRules || DEFAULT_PROMOTION_RULES;
  return rules
    .filter((rule) => rule.active)
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

/**
 * Preview what discount would apply for a given quantity
 */
export function previewDiscountForQuantity(
  basePrice: number,
  quantity: number,
  customRules?: PromotionRule[]
): {
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  appliedRule: PromotionRule | null;
} {
  const mockCart: CartItem[] = [
    {
      id: 'preview',
      name: 'Sticker',
      price: basePrice,
      quantity,
    },
  ];

  const result = calculateDiscount(mockCart, customRules);

  return {
    originalTotal: result.originalTotal,
    discountAmount: result.totalDiscount,
    finalTotal: result.finalTotal,
    appliedRule: result.appliedPromotions[0]
      ? (customRules || DEFAULT_PROMOTION_RULES).find(
          (r) => r.id === result.appliedPromotions[0].id
        ) || null
      : null,
  };
}

export { DEFAULT_PROMOTION_RULES };
