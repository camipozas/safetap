import { useCallback, useEffect, useState } from 'react';

import { type CartItem, type DiscountResult } from '@/utils/promotions';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  minQuantity: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

interface UsePromotionsReturn {
  // State
  isLoading: boolean;
  error: string | null;
  discountResult: DiscountResult | null;
  availablePromotions: Promotion[];

  // Actions
  applyDiscount: (cart: CartItem[]) => Promise<void>;
  clearDiscount: () => void;
  refreshPromotions: () => Promise<void>;
}

/**
 * Custom hook for managing quantity-based promotions
 * Handles cart discount calculations and API communication
 */
export function usePromotions(): UsePromotionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(
    null
  );
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>(
    []
  );

  // Fetch available promotions
  const refreshPromotions = useCallback(async () => {
    try {
      const response = await fetch('/api/promotions/apply-discount');
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }

      const data = await response.json();
      setAvailablePromotions(data.promotions || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch promotions'
      );
    }
  }, []);

  // Apply discount to cart
  const applyDiscount = useCallback(async (cart: CartItem[]) => {
    if (!cart || cart.length === 0) {
      setDiscountResult(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/promotions/apply-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply discount');
      }

      const data = await response.json();
      setDiscountResult(data.discount);
    } catch (err) {
      console.error('Error applying discount:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply discount');
      setDiscountResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear current discount
  const clearDiscount = useCallback(() => {
    setDiscountResult(null);
    setError(null);
  }, []);

  // Load promotions on mount
  useEffect(() => {
    refreshPromotions();
  }, [refreshPromotions]);

  return {
    isLoading,
    error,
    discountResult,
    availablePromotions,
    applyDiscount,
    clearDiscount,
    refreshPromotions,
  };
}

/**
 * Helper hook for preview mode - doesn't require authentication
 * Uses client-side calculation for immediate feedback
 */
export function usePromotionsPreview() {
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>(
    []
  );

  useEffect(() => {
    // Fetch promotions for preview
    fetch('/api/promotions/apply-discount')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setAvailablePromotions(data.promotions || []))
      .catch(() => {
        // Fallback to default promotions if API fails
        setAvailablePromotions([
          {
            id: 'bulk-2-plus',
            name: 'Descuento por cantidad',
            description: '10% de descuento por 2 o más stickers',
            minQuantity: 2,
            discountType: 'PERCENTAGE',
            discountValue: 10,
          },
          {
            id: 'bulk-5-plus',
            name: 'Descuento por cantidad',
            description: '15% de descuento por 5 o más stickers',
            minQuantity: 5,
            discountType: 'PERCENTAGE',
            discountValue: 15,
          },
          {
            id: 'bulk-10-plus',
            name: 'Descuento por cantidad',
            description: '20% de descuento por 10 o más stickers',
            minQuantity: 10,
            discountType: 'PERCENTAGE',
            discountValue: 20,
          },
        ]);
      });
  }, []);

  return { availablePromotions };
}
