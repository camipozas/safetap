'use client';

import { useEffect, useState } from 'react';

import { usePromotionsCalculator } from '@/hooks/usePromotionsCalculator';
import { formatCLPAmount } from '@/lib/constants';

export default function QuickPromotionTest() {
  const [quantity, setQuantity] = useState(4);
  const [isClient, setIsClient] = useState(false);
  const pricePerUnit = 6990;

  const {
    originalTotal,
    finalTotal,
    discountAmount,
    hasDiscount,
    appliedPromotions,
    isLoading,
    error,
  } = usePromotionsCalculator({
    quantity,
    pricePerUnit,
    itemName: 'Test Sticker',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-900 mb-2">
        🧪 Promotion Test Component
      </h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Quantity:</span>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            -
          </button>
          <span className="px-3 py-1 bg-white border rounded">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            +
          </button>
        </div>

        <div className="space-y-1 text-sm">
          <div className="text-blue-600">
            <strong>Environment:</strong> {isClient ? 'Client' : 'Server'}
          </div>
          <div>Price per unit: ${formatCLPAmount(pricePerUnit)}</div>
          <div>Original total: ${formatCLPAmount(originalTotal)}</div>
          <div>Final total: ${formatCLPAmount(finalTotal)}</div>
          <div>Discount amount: ${formatCLPAmount(discountAmount)}</div>
          <div
            className={
              hasDiscount ? 'text-green-600 font-bold' : 'text-red-600'
            }
          >
            Has discount: {hasDiscount ? 'YES' : 'NO'}
          </div>
          <div className={isLoading ? 'text-blue-600' : 'text-gray-600'}>
            Is loading: {isLoading ? 'YES' : 'NO'}
          </div>
          {error && (
            <div className="text-red-600 font-medium">Error: {error}</div>
          )}
        </div>

        {appliedPromotions.length > 0 && (
          <div>
            <h4 className="font-medium text-green-800">Applied Promotions:</h4>
            {appliedPromotions.map((promo, i) => (
              <div key={i} className="text-sm bg-green-100 p-2 rounded mt-1">
                <div className="font-medium">{promo.description}</div>
                <div>Discount: ${formatCLPAmount(promo.discountAmount)}</div>
                <div className="text-xs text-gray-600">
                  Type: {promo.discountType} | Value: {promo.discountValue}% |
                  Applied to: {promo.appliedToQuantity} items
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Raw API Test */}
        <div className="mt-4 pt-2 border-t border-yellow-300">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/promotions/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    cart: [
                      {
                        id: 'test',
                        name: 'Test Sticker',
                        price: pricePerUnit,
                        quantity,
                      },
                    ],
                  }),
                });
                const result = await response.json();
                console.log('🧪 Direct API Test Result:', result);
                console.log(
                  `Direct API Test: Discount: $${formatCLPAmount(result.totalDiscount)}, Final: $${formatCLPAmount(result.finalTotal)}`
                );
              } catch (err) {
                console.error('API Test Error:', err);
                console.error('API Test failed - check console');
              }
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Test API Directly
          </button>
        </div>
      </div>
    </div>
  );
}
