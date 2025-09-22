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

const DEFAULT_PROMOTION_RULES: PromotionRule[] = [
  {
    id: 'bulk-2-plus',
    minQuantity: 2,
    discountType: 'percentage',
    discountValue: 10,
    description: '10% de descuento por 2 o más stickers',
    active: true,
  },
  {
    id: 'bulk-5-plus',
    minQuantity: 5,
    discountType: 'percentage',
    discountValue: 15,
    description: '15% de descuento por 5 o más stickers',
    active: true,
  },
  {
    id: 'bulk-10-plus',
    minQuantity: 10,
    discountType: 'percentage',
    discountValue: 20,
    description: '20% de descuento por 10 o más stickers',
    active: true,
  },
];

/**
 * Calculate total quantity in cart
 *
 * @param cart - Array of cart items
 * @returns Total quantity of all items in cart
 */
function getTotalQuantity(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculate cart subtotal before discounts
 *
 * @param cart - Array of cart items
 * @returns Total amount before any discounts
 */
function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Find the best applicable promotion rule based on quantity
 *
 * @param totalQuantity - Total quantity of items in cart
 * @param rules - Array of promotion rules to evaluate
 * @returns The best applicable promotion rule or null if none apply
 */
function findBestPromotionRule(
  totalQuantity: number,
  rules: PromotionRule[] = DEFAULT_PROMOTION_RULES
): PromotionRule | null {
  const applicableRules = rules
    .filter((rule) => rule.active && totalQuantity >= rule.minQuantity)
    .sort((a, b) => {
      if (b.minQuantity !== a.minQuantity) {
        return b.minQuantity - a.minQuantity;
      }
      return b.discountValue - a.discountValue;
    });

  return applicableRules[0] || null;
}

/**
 * Calculate discount amount based on promotion rule
 *
 * @param subtotal - Cart subtotal before discount
 * @param rule - Promotion rule to apply
 * @returns Calculated discount amount
 */
function calculateDiscountAmount(
  subtotal: number,
  rule: PromotionRule
): number {
  if (rule.discountType === 'percentage') {
    return Math.round(subtotal * (rule.discountValue / 100));
  } else {
    return Math.min(rule.discountValue, subtotal);
  }
}

/**
 * Calculate discounts for a cart based on quantity-based promotion rules
 *
 * @param cart - Array of cart items
 * @param customRules - Optional custom promotion rules to use instead of defaults
 * @returns Discount calculation result with totals and applied promotions
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

  const applicableRule = findBestPromotionRule(totalQuantity, rules);

  if (!applicableRule) {
    return {
      totalDiscount: 0,
      updatedCart: validCart,
      appliedPromotions: [],
      originalTotal,
      finalTotal: originalTotal,
    };
  }

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
 *
 * @param discount - Applied promotion object
 * @returns Formatted discount string for display
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
 *
 * @param customRules - Optional custom promotion rules
 * @returns Array of active promotion rules sorted by minimum quantity
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
 *
 * @param basePrice - Base price per item
 * @param quantity - Quantity of items
 * @param customRules - Optional custom promotion rules
 * @returns Preview of discount calculation with totals and applied rule
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
