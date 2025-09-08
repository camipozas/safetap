'use client';

import { useEffect, useState } from 'react';

import {
  calculateDiscount,
  CartItem,
  DiscountResult,
} from '@/utils/promotions';

interface UsePromotionsCalculatorProps {
  quantity: number;
  pricePerUnit: number;
  itemName?: string;
}

export function usePromotionsCalculator({
  quantity,
  pricePerUnit,
  itemName = 'Sticker',
}: UsePromotionsCalculatorProps) {
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if invalid params
    if (quantity <= 0 || pricePerUnit <= 0) {
      return;
    }

    // Skip if running on server side
    if (typeof window === 'undefined') {
      console.log('⏭️ Skipping calculation - running on server');
      return;
    }

    console.log('🚀 Starting discount calculation for:', {
      quantity,
      pricePerUnit,
    });

    setIsLoading(true);
    setError(null);

    // Create cart item for calculation
    const cart: CartItem[] = [
      {
        id: 'sticker-order',
        name: itemName,
        price: pricePerUnit,
        quantity,
      },
    ];

    // Start with local calculation as immediate fallback
    const localResult = calculateDiscount(cart);
    console.log('📱 Local discount result:', localResult);
    setDiscountResult(localResult);

    // Fetch server result to get latest promotion rules
    console.log('🌐 Fetching server discount result...');
    fetch('/api/promotions/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart }),
    })
      .then(async (response) => {
        console.log('📡 Response status:', response.status, 'OK:', response.ok);
        if (response.ok) {
          const serverResult = await response.json();
          console.log('✅ Server discount result received:', serverResult);
          setDiscountResult(serverResult);
        } else {
          console.warn('❌ Server request failed, keeping local result');
          setError('Failed to fetch latest promotions');
        }
      })
      .catch((err) => {
        console.error('❌ Server request error:', err);
        setError('Network error fetching promotions');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [quantity, pricePerUnit, itemName]);

  // Calculate return values - always provide sensible defaults
  const hasDiscount = discountResult ? discountResult.totalDiscount > 0 : false;
  const originalTotal =
    discountResult?.originalTotal ?? quantity * pricePerUnit;
  const finalTotal = discountResult?.finalTotal ?? quantity * pricePerUnit;
  const discountAmount = discountResult?.totalDiscount ?? 0;
  const appliedPromotions = discountResult?.appliedPromotions ?? [];

  console.log('🔍 Hook state:', {
    hasDiscountResult: !!discountResult,
    hasDiscount,
    originalTotal,
    finalTotal,
    discountAmount,
    promotionsCount: appliedPromotions.length,
  });

  return {
    discountResult,
    isLoading,
    error,
    hasDiscount,
    originalTotal,
    finalTotal,
    discountAmount,
    appliedPromotions,
  };
}
