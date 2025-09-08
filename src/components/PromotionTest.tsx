'use client';

import { useState } from 'react';

import { PRICE_PER_STICKER_CLP, formatCLPAmount } from '@/lib/constants';
import { calculateDiscount } from '@/utils/promotions';

export default function PromotionTest() {
  const [quantity, setQuantity] = useState(3);

  const cart = [
    {
      id: 'test',
      name: 'Test Sticker',
      price: PRICE_PER_STICKER_CLP,
      quantity,
    },
  ];

  const result = calculateDiscount(cart);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-4">Promotion Test Debug</h3>

      <div className="mb-4">
        <label htmlFor="quantity-input">Quantity: </label>
        <input
          id="quantity-input"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="border px-2 py-1 ml-2"
          min="1"
          max="20"
        />
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Cart:</strong> {JSON.stringify(cart, null, 2)}
        </div>
        <div>
          <strong>Original Total:</strong> $
          {formatCLPAmount(result.originalTotal)}
        </div>
        <div>
          <strong>Discount Amount:</strong> $
          {formatCLPAmount(result.totalDiscount)}
        </div>
        <div>
          <strong>Final Total:</strong> ${formatCLPAmount(result.finalTotal)}
        </div>
        <div>
          <strong>Applied Promotions:</strong>{' '}
          {JSON.stringify(result.appliedPromotions, null, 2)}
        </div>
        <div>
          <strong>Has Discount:</strong>{' '}
          {result.totalDiscount > 0 ? 'YES' : 'NO'}
        </div>
      </div>
    </div>
  );
}
