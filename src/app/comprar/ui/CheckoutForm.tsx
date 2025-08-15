"use client";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '@/lib/validators';
import type { z } from 'zod';
import { useState } from 'react';
import { CountrySelect } from '@/components/CountrySelect';

export default function CheckoutForm({ userEmail }: { userEmail?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { quantity: 1, flagCode: '', nameOnSticker: '' },
  });

  async function onSubmit(data: z.infer<typeof checkoutSchema>) {
    setServerError(null);
    const res = await fetch('/api/checkout/transfer/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data, email: userEmail }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setServerError(j.error ?? 'Error al crear el pedido');
      return;
    }
    const result = await res.json();
    window.location.href = `/account?ref=${encodeURIComponent(result.reference)}`;
  }

  const qty = watch('quantity');
  const price = 15; // Precio por sticker
  const total = qty * price;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Nombre en sticker */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2" htmlFor="name">
          Nombre en el sticker
        </label>
        <input 
          id="name" 
          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200" 
          placeholder="Ej: María García"
          aria-invalid={!!errors.nameOnSticker} 
          aria-describedby={errors.nameOnSticker ? 'name-error' : undefined} 
          {...register('nameOnSticker')} 
        />
        {errors.nameOnSticker && (
          <p id="name-error" className="text-red-600 text-sm mt-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.nameOnSticker.message}
          </p>
        )}
      </div>

      {/* Selector de país */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Bandera del país
        </label>
        <CountrySelect 
          name="flagCode" 
          value={watch('flagCode')} 
          onChange={(v) => setValue('flagCode', v as any)} 
          error={errors.flagCode?.message} 
        />
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2" htmlFor="quantity">
          Cantidad
        </label>
        <div className="relative">
          <input 
            id="quantity" 
            type="number" 
            min={1} 
            max={10} 
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all duration-200" 
            aria-invalid={!!errors.quantity} 
            aria-describedby={errors.quantity ? 'qty-error' : undefined} 
            {...register('quantity', { valueAsNumber: true })} 
          />
          <div className="absolute right-3 top-3 text-slate-500">
            <span className="text-sm">unidades</span>
          </div>
        </div>
        {errors.quantity && (
          <p id="qty-error" className="text-red-600 text-sm mt-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.quantity.message}
          </p>
        )}
      </div>

      {/* Resumen de precio */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Resumen del pedido</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>{qty} sticker{qty > 1 ? 's' : ''} × €{price}</span>
            <span>€{qty * price}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Envío</span>
            <span>Gratis</span>
          </div>
          <div className="border-t border-slate-300 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-slate-900 text-lg">
              <span>Total</span>
              <span>€{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Método de pago */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Pago por transferencia bancaria</h4>
            <p className="text-blue-700 text-sm">
              Al confirmar el pedido, te proporcionaremos los datos bancarios y una referencia única. 
              Una vez realizada la transferencia, verificaremos el pago y procesaremos tu pedido.
            </p>
          </div>
        </div>
      </div>

      {/* Error del servidor */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 font-medium">{serverError}</p>
          </div>
        </div>
      )}

      {/* Botón de envío */}
      <button 
        className="w-full bg-brand hover:bg-brand-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        type="submit" 
        disabled={isSubmitting}
        aria-label={`Confirmar pedido de ${qty} sticker${qty > 1 ? 's' : ''} por €${total}`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </>
        ) : (
          <>
            Confirmar pedido - €{total}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
