'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import BankAccountInfo from '@/components/BankAccountInfo';
import DiscountCodeInput from '@/components/DiscountCodeInput';
import { StickerCustomization } from '@/components/StickerCustomizerNew';
import { useTemporaryPaymentRef } from '@/hooks/useTemporaryPaymentRef';
import { getColorPresetById } from '@/lib/color-presets';
import { PRICE_PER_STICKER_CLP, formatCLPAmount } from '@/lib/constants';

// Schema for checkout form (quantity + optional email if not logged in)
const checkoutSchema = z.object({
  quantity: z
    .number()
    .min(1, 'Minimum 1 sticker')
    .max(10, 'Maximum 10 stickers'),
  email: z.string().email('Invalid email').optional(),
});

interface CheckoutFormProps {
  customization: StickerCustomization;
}

export default function CheckoutForm({ customization }: CheckoutFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
    newTotal: number;
  } | null>(null);
  const { tempReference, markAsConfirmed } = useTemporaryPaymentRef();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { quantity: 1 },
  });

  async function onSubmit(data: z.infer<typeof checkoutSchema>) {
    setServerError(null);

    // Ensure name is set in customization
    if (!customization.name.trim()) {
      setServerError('Please enter your name in the customizer');
      return;
    }

    const orderData = {
      ...data,
      nameOnSticker: customization.name,
      flagCode: customization.flagCode,
      colorPresetId: customization.colorPresetId,
      stickerColor: customization.stickerColor,
      textColor: customization.textColor,
      discountCode: appliedDiscount?.code,
      tempReference, // Send the temporary reference
    };

    // Use different endpoint and format based on quantity
    let requestData;
    let endpoint;

    if (data.quantity > 1) {
      // For multiple stickers, convert to multi-sticker format
      endpoint = '/api/checkout/multi-sticker/init';
      requestData = {
        email: orderData.email,
        discountCode: orderData.discountCode,
        tempReference: orderData.tempReference,
        stickers: Array.from({ length: data.quantity }, () => ({
          nameOnSticker: orderData.nameOnSticker,
          flagCode: orderData.flagCode,
          colorPresetId: orderData.colorPresetId,
          stickerColor: orderData.stickerColor,
          textColor: orderData.textColor,
        })),
      };
    } else {
      // For single sticker, use original format
      endpoint = '/api/checkout/transfer/init';
      requestData = orderData;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setServerError(j.error ?? 'Error at creating order');
      return;
    }

    const result = await res.json();
    // Mark the temporary reference as confirmed
    if (result.reference) {
      markAsConfirmed(result.reference);
    }
    window.location.href = `/account?ref=${encodeURIComponent(result.reference)}`;
  }

  const qty = watch('quantity');
  const price = PRICE_PER_STICKER_CLP;
  const subtotal = qty * price;
  const total = appliedDiscount ? appliedDiscount.newTotal : subtotal;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Email */}
      <div>
        <label
          className="block text-sm font-semibold text-slate-900 mb-2"
          htmlFor="email"
        >
          Email *
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200"
          placeholder="tu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p
            id="email-error"
            className="text-red-600 text-sm mt-1 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Summary of customization */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">
          Tu sticker personalizado
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Nombre:</span>
            <span className="font-medium">
              {customization.name || 'Sin nombre'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">País:</span>
            <span className="font-medium">{customization.flagCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Esquema de colores:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: customization.stickerColor }}
              />
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: customization.textColor }}
              />
              <span className="font-medium text-xs">
                {getColorPresetById(customization.colorPresetId)?.name ||
                  'Personalizado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label
          className="block text-sm font-semibold text-slate-900 mb-3"
          htmlFor="quantity"
        >
          Cantidad de stickers
        </label>

        <div className="flex items-center justify-center">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg">
            <button
              type="button"
              onClick={() => {
                const currentValue = Number(watch('quantity')) || 1;
                if (currentValue > 1) {
                  setValue('quantity', currentValue - 1);
                  trigger('quantity');
                }
              }}
              disabled={Number(watch('quantity')) <= 1}
              className="w-8 h-8 rounded-l-lg bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-bold"
            >
              -
            </button>

            <div className="w-12 h-8 flex items-center justify-center border-x border-slate-300">
              <span className="text-lg font-bold text-slate-900">
                {watch('quantity') || 1}
              </span>
              <input
                type="hidden"
                {...register('quantity', { valueAsNumber: true })}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const currentValue = Number(watch('quantity')) || 1;
                if (currentValue < 10) {
                  setValue('quantity', currentValue + 1);
                  trigger('quantity');
                }
              }}
              disabled={Number(watch('quantity')) >= 10}
              className="w-8 h-8 rounded-r-lg bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
        </div>

        {errors.quantity && (
          <p className="text-red-600 text-sm mt-2 flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Discount Code Input */}
      <DiscountCodeInput
        cartTotal={subtotal}
        onDiscountApplied={(result) => {
          if (
            result.valid &&
            result.newTotal !== undefined &&
            result.appliedDiscount !== undefined
          ) {
            setAppliedDiscount({
              code: result.code,
              amount: result.appliedDiscount,
              newTotal: result.newTotal,
            });
          }
        }}
        onDiscountRemoved={() => setAppliedDiscount(null)}
        appliedDiscount={appliedDiscount}
      />

      {/* Summary of price */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">
          Resumen del pedido
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>
              {qty} sticker{qty > 1 ? 's' : ''} personalizado
              {qty > 1 ? 's' : ''} × ${formatCLPAmount(price)}
            </span>
            <span>${formatCLPAmount(subtotal)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({appliedDiscount.code})</span>
              <span>-${formatCLPAmount(appliedDiscount.amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Envío</span>
            <span>Gratis</span>
          </div>
          <div className="border-t border-slate-300 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-slate-900 text-lg">
              <span>Total</span>
              <span>${formatCLPAmount(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Pago por transferencia bancaria
            </h4>
            <p className="text-blue-700 text-sm">
              Al confirmar el pedido, te proporcionaremos los datos bancarios y
              una referencia única. Una vez realizada la transferencia,
              verificaremos el pago y procesaremos tu pedido.
            </p>
          </div>
        </div>
      </div>

      {/* Datos Bancarios */}
      <BankAccountInfo
        paymentReference={
          tempReference
            ? {
                reference: tempReference,
                amount: total,
                description: `${qty} sticker${qty > 1 ? 's' : ''} SafeTap - ${customization.name}`,
              }
            : null
        }
      />

      {/* Server error */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-800 font-medium">{serverError}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        type="submit"
        disabled={isSubmitting || !customization.name.trim()}
        aria-label={`Confirmar pedido de ${qty} sticker${qty > 1 ? 's' : ''} por $${formatCLPAmount(total)}`}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Procesando...
          </>
        ) : (
          <>
            Confirmar pedido - ${formatCLPAmount(total)}
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </>
        )}
      </button>

      {!customization.name.trim() && (
        <p className="text-sm text-amber-600 text-center">
          Complete la personalización de su sticker para continuar
        </p>
      )}
    </form>
  );
}
