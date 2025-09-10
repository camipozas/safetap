import { describe, expect, it } from 'vitest';

import {
  calculateDiscount,
  DEFAULT_PROMOTION_RULES,
  getPromotionTiers,
  previewDiscountForQuantity,
  type CartItem,
  type PromotionRule,
} from '@/utils/promotions';

const basePrice = 6990; // CLP

const mockCartItem = (quantity: number, id = 'sticker-1'): CartItem => ({
  id,
  name: 'SafeTap Sticker',
  price: basePrice,
  quantity,
});

describe('Promotions Utility Functions', () => {
  const mockCustomRules: PromotionRule[] = [
    {
      id: 'custom-2-plus',
      minQuantity: 2,
      discountType: 'percentage',
      discountValue: 15,
      description: 'Custom 15% off for 2+ items',
      active: true,
    },
    {
      id: 'custom-5-plus',
      minQuantity: 5,
      discountType: 'fixed',
      discountValue: 5000,
      description: 'Custom $5000 off for 5+ items',
      active: true,
    },
  ];

  describe('calculateDiscount', () => {
    it('should return no discount for single item', () => {
      const cart = [mockCartItem(1)];
      const result = calculateDiscount(cart);

      expect(result.totalDiscount).toBe(0);
      expect(result.finalTotal).toBe(basePrice);
      expect(result.originalTotal).toBe(basePrice);
      expect(result.appliedPromotions).toHaveLength(0);
    });

    it('should apply 10% discount for 2 items with default rules', () => {
      const cart = [mockCartItem(2)];
      const result = calculateDiscount(cart);

      const expectedOriginal = basePrice * 2;
      const expectedDiscount = Math.round(expectedOriginal * 0.1);
      const expectedFinal = expectedOriginal - expectedDiscount;

      expect(result.totalDiscount).toBe(expectedDiscount);
      expect(result.originalTotal).toBe(expectedOriginal);
      expect(result.finalTotal).toBe(expectedFinal);
      expect(result.appliedPromotions).toHaveLength(1);
      expect(result.appliedPromotions[0].id).toBe('bulk-2-plus');
      expect(result.appliedPromotions[0].discountType).toBe('percentage');
      expect(result.appliedPromotions[0].discountValue).toBe(10);
    });

    it('should apply 15% discount for 5 items (higher tier)', () => {
      const cart = [mockCartItem(5)];
      const result = calculateDiscount(cart);

      const expectedOriginal = basePrice * 5;
      const expectedDiscount = Math.round(expectedOriginal * 0.15);

      expect(result.totalDiscount).toBe(expectedDiscount);
      expect(result.appliedPromotions[0].id).toBe('bulk-5-plus');
      expect(result.appliedPromotions[0].discountValue).toBe(15);
    });

    it('should apply highest tier discount for 10+ items', () => {
      const cart = [mockCartItem(10)];
      const result = calculateDiscount(cart);

      const expectedOriginal = basePrice * 10;
      const expectedDiscount = Math.round(expectedOriginal * 0.2);

      expect(result.totalDiscount).toBe(expectedDiscount);
      expect(result.appliedPromotions[0].id).toBe('bulk-10-plus');
      expect(result.appliedPromotions[0].discountValue).toBe(20);
    });

    it('should handle multiple items in cart with same total quantity', () => {
      const cart = [mockCartItem(3, 'sticker-1'), mockCartItem(2, 'sticker-2')];
      const result = calculateDiscount(cart);

      // Total quantity is 5, should get 15% discount
      const expectedOriginal = basePrice * 5;
      const expectedDiscount = Math.round(expectedOriginal * 0.15);

      expect(result.totalDiscount).toBe(expectedDiscount);
      expect(result.appliedPromotions[0].id).toBe('bulk-5-plus');
    });

    it('should handle custom promotion rules', () => {
      const cart = [mockCartItem(2)];
      const result = calculateDiscount(cart, mockCustomRules);

      const expectedOriginal = basePrice * 2;
      const expectedDiscount = Math.round(expectedOriginal * 0.15);

      expect(result.totalDiscount).toBe(expectedDiscount);
      expect(result.appliedPromotions[0].id).toBe('custom-2-plus');
      expect(result.appliedPromotions[0].discountValue).toBe(15);
    });

    it('should handle fixed discount type', () => {
      const cart = [mockCartItem(5)];
      const result = calculateDiscount(cart, mockCustomRules);

      expect(result.totalDiscount).toBe(5000);
      expect(result.appliedPromotions[0].id).toBe('custom-5-plus');
      expect(result.appliedPromotions[0].discountType).toBe('fixed');
    });

    it('should handle empty cart', () => {
      const result = calculateDiscount([]);

      expect(result.totalDiscount).toBe(0);
      expect(result.originalTotal).toBe(0);
      expect(result.finalTotal).toBe(0);
      expect(result.appliedPromotions).toHaveLength(0);
      expect(result.updatedCart).toHaveLength(0);
    });

    it('should filter out invalid cart items', () => {
      const cart = [
        mockCartItem(2),
        { id: '', name: '', price: 0, quantity: 0 }, // Invalid item
        { id: 'valid', name: 'Valid', price: 1000, quantity: 1 },
      ];
      const result = calculateDiscount(cart);

      expect(result.updatedCart).toHaveLength(2); // Only valid items
      expect(result.originalTotal).toBe(basePrice * 2 + 1000);
    });

    it('should not exceed 100% discount for percentage discounts', () => {
      const extremeRules: PromotionRule[] = [
        {
          id: 'extreme',
          minQuantity: 1,
          discountType: 'percentage',
          discountValue: 150, // Over 100%
          description: 'Extreme discount',
          active: true,
        },
      ];

      const cart = [mockCartItem(1)];
      const result = calculateDiscount(cart, extremeRules);

      // Should cap the discount calculation at reasonable levels
      expect(result.finalTotal).toBeGreaterThanOrEqual(0);
    });

    it('should not exceed cart total for fixed discounts', () => {
      const highFixedRules: PromotionRule[] = [
        {
          id: 'high-fixed',
          minQuantity: 1,
          discountType: 'fixed',
          discountValue: 50000, // Higher than cart total
          description: 'High fixed discount',
          active: true,
        },
      ];

      const cart = [mockCartItem(1)];
      const result = calculateDiscount(cart, highFixedRules);

      expect(result.finalTotal).toBe(0); // Should not go below 0
      expect(result.totalDiscount).toBeLessThanOrEqual(result.originalTotal);
    });
  });

  describe('previewDiscountForQuantity', () => {
    it('should preview discount for given quantity', () => {
      const preview = previewDiscountForQuantity(basePrice, 3);

      const expectedOriginal = basePrice * 3;
      const expectedDiscount = Math.round(expectedOriginal * 0.1); // 10% for 2+ items

      expect(preview.originalTotal).toBe(expectedOriginal);
      expect(preview.discountAmount).toBe(expectedDiscount);
      expect(preview.finalTotal).toBe(expectedOriginal - expectedDiscount);
      expect(preview.appliedRule?.id).toBe('bulk-2-plus');
    });

    it('should return no discount for quantity below minimum', () => {
      const preview = previewDiscountForQuantity(basePrice, 1);

      expect(preview.discountAmount).toBe(0);
      expect(preview.appliedRule).toBeNull();
    });
  });

  describe('getPromotionTiers', () => {
    it('should return active promotion tiers sorted by minQuantity', () => {
      const tiers = getPromotionTiers();

      expect(tiers).toHaveLength(DEFAULT_PROMOTION_RULES.length);
      expect(tiers[0].minQuantity).toBe(2);
      expect(tiers[1].minQuantity).toBe(5);
      expect(tiers[2].minQuantity).toBe(10);
    });

    it('should filter out inactive rules', () => {
      const rulesWithInactive: PromotionRule[] = [
        ...mockCustomRules,
        {
          id: 'inactive',
          minQuantity: 20,
          discountType: 'percentage',
          discountValue: 30,
          description: 'Inactive rule',
          active: false,
        },
      ];

      const tiers = getPromotionTiers(rulesWithInactive);

      expect(tiers).toHaveLength(2); // Only active rules
      expect(tiers.every((tier) => tier.active)).toBe(true);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle zero-price items', () => {
      const cart = [{ id: 'free', name: 'Free Item', price: 0, quantity: 5 }];
      const result = calculateDiscount(cart);

      expect(result.originalTotal).toBe(0);
      expect(result.totalDiscount).toBe(0);
      expect(result.finalTotal).toBe(0);
    });

    it('should handle negative quantities (filter them out)', () => {
      const cart = [
        { id: 'negative', name: 'Negative', price: 1000, quantity: -1 },
        mockCartItem(3),
      ];
      const result = calculateDiscount(cart);

      expect(result.updatedCart).toHaveLength(1); // Only positive quantity items
    });

    it('should prioritize rules correctly when multiple rules apply', () => {
      const overlappingRules: PromotionRule[] = [
        {
          id: 'lower-priority',
          minQuantity: 2,
          discountType: 'percentage',
          discountValue: 5,
          description: 'Lower priority',
          active: true,
        },
        {
          id: 'higher-priority',
          minQuantity: 2,
          discountType: 'percentage',
          discountValue: 15,
          description: 'Higher priority',
          active: true,
        },
      ];

      const cart = [mockCartItem(2)];
      const result = calculateDiscount(cart, overlappingRules);

      // Should pick the rule with higher discount value
      expect(result.appliedPromotions[0].id).toBe('higher-priority');
      expect(result.appliedPromotions[0].discountValue).toBe(15);
    });
  });
});

describe('Promotions Integration Scenarios', () => {
  it('should handle real-world sticker pricing scenarios', () => {
    const scenarios = [
      {
        quantity: 1,
        expectedDiscount: 0,
        description: 'Single sticker - no discount',
      },
      {
        quantity: 2,
        expectedDiscountPercent: 10,
        description: '2 stickers - 10% off',
      },
      {
        quantity: 5,
        expectedDiscountPercent: 15,
        description: '5 stickers - 15% off',
      },
      {
        quantity: 10,
        expectedDiscountPercent: 20,
        description: '10 stickers - 20% off',
      },
      {
        quantity: 25,
        expectedDiscountPercent: 20,
        description: '25 stickers - still 20% off (highest tier)',
      },
    ];

    scenarios.forEach(
      ({
        quantity,
        expectedDiscount,
        expectedDiscountPercent,
        description: _description,
      }) => {
        const cart = [mockCartItem(quantity)];
        const result = calculateDiscount(cart);
        const originalTotal = 6990 * quantity;

        if (expectedDiscount !== undefined) {
          expect(result.totalDiscount).toBe(expectedDiscount);
        }

        if (expectedDiscountPercent !== undefined) {
          const expectedDiscountAmount = Math.round(
            originalTotal * (expectedDiscountPercent / 100)
          );
          expect(result.totalDiscount).toBe(expectedDiscountAmount);
        }
      }
    );
  });

  it('should calculate bulk order savings correctly', () => {
    const bulkOrder = [mockCartItem(50)]; // Large corporate order
    const result = calculateDiscount(bulkOrder);

    const originalTotal = 6990 * 50; // $349,500 CLP
    const discountAmount = Math.round(originalTotal * 0.2); // 20% off
    const finalTotal = originalTotal - discountAmount;

    expect(result.originalTotal).toBe(originalTotal);
    expect(result.totalDiscount).toBe(discountAmount);
    expect(result.finalTotal).toBe(finalTotal);

    // Verify significant savings
    expect(discountAmount).toBeGreaterThan(50000); // Should save at least $50,000 CLP
  });
});
