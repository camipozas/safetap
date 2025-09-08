'use client';

import { useEffect, useState } from 'react';

import PromotionsCalculator from '@/components/PromotionsCalculator';
import { usePromotions } from '@/hooks/usePromotions';
import { PRICE_PER_STICKER_CLP } from '@/lib/constants';
import { type CartItem } from '@/utils/promotions';

interface CheckoutWithPromotionsProps {
  className?: string;
}

export default function CheckoutWithPromotions({
  className = '',
}: CheckoutWithPromotionsProps) {
  const [stickerQuantity, setStickerQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  const {
    isLoading: promotionsLoading,
    error: promotionsError,
    discountResult,
    applyDiscount,
  } = usePromotions();

  // Update cart when quantity changes
  useEffect(() => {
    const newCart: CartItem[] = [
      {
        id: 'safetap-sticker',
        name: 'SafeTap Emergency Sticker',
        price: PRICE_PER_STICKER_CLP,
        quantity: stickerQuantity,
      },
    ];
    setCart(newCart);
  }, [stickerQuantity]);

  // Apply promotions when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      applyDiscount(cart);
    }
  }, [cart, applyDiscount]);

  // Update totals when discount result changes
  useEffect(() => {
    if (discountResult) {
      setDiscountAmount(discountResult.totalDiscount);
      setFinalTotal(discountResult.finalTotal);
    } else {
      setDiscountAmount(0);
      const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setFinalTotal(total);
    }
  }, [discountResult, cart]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCheckout = async () => {
    console.log('🛒 Proceeding to checkout with:', {
      cart,
      subtotal,
      discountAmount,
      finalTotal,
      appliedPromotions: discountResult?.appliedPromotions || [],
    });

    // Here you would integrate with your actual checkout flow
    // The discount information is ready to be sent to your payment API
    console.log(
      `✅ Checkout initiated with total: ${formatCurrency(finalTotal)}`
    );
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Checkout - SafeTap Emergency Stickers
        </h2>

        {/* Product Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Quantity
          </h3>

          <div className="flex items-center space-x-4">
            <label
              htmlFor="quantity"
              className="text-sm font-medium text-gray-700"
            >
              Number of stickers:
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() =>
                  setStickerQuantity(Math.max(1, stickerQuantity - 1))
                }
                className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                disabled={stickerQuantity <= 1}
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={stickerQuantity}
                onChange={(e) =>
                  setStickerQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setStickerQuantity(stickerQuantity + 1)}
                className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Unit price: {formatCurrency(PRICE_PER_STICKER_CLP)} per sticker
          </div>
        </div>

        {/* Promotions Calculator */}
        <div className="mb-8">
          <PromotionsCalculator
            onDiscountChange={(discount, total) => {
              setDiscountAmount(discount);
              setFinalTotal(total);
            }}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                SafeTap Stickers × {stickerQuantity}
              </span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Quantity Discount
                  {discountResult?.appliedPromotions[0] && (
                    <span className="ml-1">
                      ({discountResult.appliedPromotions[0].description})
                    </span>
                  )}
                </span>
                <span className="text-green-600">
                  −{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span
                className={
                  discountAmount > 0 ? 'text-green-600' : 'text-gray-900'
                }
              >
                {formatCurrency(finalTotal)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="text-sm text-green-600 font-medium">
                You saved {formatCurrency(discountAmount)}! 🎉
              </div>
            )}
          </div>

          {promotionsLoading && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Calculating promotions...
            </div>
          )}

          {promotionsError && (
            <div className="mt-4 text-center text-sm text-red-600">
              Error applying promotions: {promotionsError}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={promotionsLoading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {promotionsLoading
              ? 'Processing...'
              : `Proceed to Payment - ${formatCurrency(finalTotal)}`}
          </button>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 Smart Quantity Pricing
          </h4>
          <p className="text-blue-700 text-sm mb-2">
            Our automatic quantity discounts help you save more when you buy
            more. Perfect for families, teams, or organizations!
          </p>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 2+ stickers: 10% discount</li>
            <li>• 5+ stickers: 15% discount</li>
            <li>• 10+ stickers: 20% discount</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
