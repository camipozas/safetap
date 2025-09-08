'use client';

import { useEffect, useState } from 'react';

import { usePromotions } from '@/hooks/usePromotions';
import { PRICE_PER_STICKER_CLP } from '@/lib/constants';
import { type CartItem } from '@/utils/promotions';

interface PromotionsCalculatorProps {
  className?: string;
  onDiscountChange?: (discountAmount: number, finalTotal: number) => void;
}

export default function PromotionsCalculator({
  className = '',
  onDiscountChange,
}: PromotionsCalculatorProps) {
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  const {
    isLoading,
    error,
    discountResult,
    availablePromotions,
    applyDiscount,
    clearDiscount,
  } = usePromotions();

  // Update cart when quantity changes
  useEffect(() => {
    if (quantity > 0) {
      const newCart: CartItem[] = [
        {
          id: 'sticker-1',
          name: 'SafeTap Sticker',
          price: PRICE_PER_STICKER_CLP,
          quantity,
        },
      ];
      setCart(newCart);
    } else {
      setCart([]);
    }
  }, [quantity]);

  // Apply discount when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      applyDiscount(cart);
    } else {
      clearDiscount();
    }
  }, [cart, applyDiscount, clearDiscount]);

  // Notify parent of discount changes
  useEffect(() => {
    if (onDiscountChange && discountResult) {
      onDiscountChange(discountResult.totalDiscount, discountResult.finalTotal);
    } else if (onDiscountChange && cart.length > 0) {
      const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      onDiscountChange(0, total);
    }
  }, [discountResult, cart, onDiscountChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getNextPromotionTier = () => {
    const currentQuantity = quantity;
    const nextPromo = availablePromotions.find(
      (promo) => promo.minQuantity > currentQuantity
    );
    return nextPromo;
  };

  const nextTier = getNextPromotionTier();
  const appliedPromotion = discountResult?.appliedPromotions[0];

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Calculadora de Descuentos por Cantidad
      </h3>

      {/* Quantity Selector */}
      <div className="mb-6">
        <label
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Cantidad de stickers
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={quantity <= 1}
          >
            −
          </button>
          <input
            id="quantity"
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      {cart.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Precio unitario:</span>
            <span>{formatCurrency(PRICE_PER_STICKER_CLP)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Subtotal ({quantity} × {formatCurrency(PRICE_PER_STICKER_CLP)}):
            </span>
            <span>{formatCurrency(discountResult?.originalTotal || 0)}</span>
          </div>

          {appliedPromotion && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento ({appliedPromotion.description}):</span>
              <span>−{formatCurrency(appliedPromotion.discountAmount)}</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between font-semibold">
            <span>Total:</span>
            <span className={appliedPromotion ? 'text-green-600' : ''}>
              {formatCurrency(
                discountResult?.finalTotal || discountResult?.originalTotal || 0
              )}
            </span>
          </div>

          {appliedPromotion && (
            <div className="text-sm text-green-600 font-medium">
              ¡Ahorraste {formatCurrency(appliedPromotion.discountAmount)}!
            </div>
          )}
        </div>
      )}

      {/* Available Promotions */}
      {availablePromotions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Descuentos disponibles:
          </h4>
          <div className="space-y-2">
            {availablePromotions.map((promo) => (
              <div
                key={promo.id}
                className={`text-sm p-3 rounded-md border ${
                  appliedPromotion?.id === promo.id
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : quantity >= promo.minQuantity
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {promo.minQuantity}+ stickers:
                  </span>
                  <span>
                    {promo.discountType === 'PERCENTAGE'
                      ? `${promo.discountValue}% OFF`
                      : `${formatCurrency(promo.discountValue)} OFF`}
                  </span>
                </div>
                {promo.description && (
                  <p className="text-xs mt-1 opacity-75">{promo.description}</p>
                )}
                {appliedPromotion?.id === promo.id && (
                  <p className="text-xs mt-1 font-medium">✓ Aplicado</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Tier Incentive */}
      {nextTier && !appliedPromotion && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
          <p className="font-medium">¡Casi lo logras! 🎉</p>
          <p>
            Agrega {nextTier.minQuantity - quantity} sticker
            {nextTier.minQuantity - quantity > 1 ? 's' : ''} más para obtener{' '}
            {nextTier.discountType === 'PERCENTAGE'
              ? `${nextTier.discountValue}% de descuento`
              : `${formatCurrency(nextTier.discountValue)} de descuento`}
          </p>
        </div>
      )}

      {/* Loading/Error States */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center text-sm text-gray-600">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Calculando descuento...
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          Error: {error}
        </div>
      )}
    </div>
  );
}
