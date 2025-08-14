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
    formState: { errors },
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <div>
        <label className="label" htmlFor="name">Nombre en sticker</label>
        <input id="name" className="input" aria-invalid={!!errors.nameOnSticker} aria-describedby={errors.nameOnSticker ? 'name-error' : undefined} {...register('nameOnSticker')} />
        {errors.nameOnSticker && <p id="name-error" className="error">{errors.nameOnSticker.message}</p>}
      </div>
      <CountrySelect name="flagCode" value={watch('flagCode')} onChange={(v) => setValue('flagCode', v as any)} error={errors.flagCode?.message} />
      <div>
        <label className="label" htmlFor="quantity">Cantidad</label>
        <input id="quantity" type="number" min={1} max={10} className="input" aria-invalid={!!errors.quantity} aria-describedby={errors.quantity ? 'qty-error' : undefined} {...register('quantity', { valueAsNumber: true })} />
        {errors.quantity && <p id="qty-error" className="error">{errors.quantity.message}</p>}
      </div>
      <div className="rounded-md bg-white p-4 border">
        <p className="font-medium">Pago por transferencia</p>
        <p className="text-sm text-slate-600 mt-1">Al confirmar, te daremos una referencia y datos bancarios. Podrás completar el pago luego.</p>
      </div>
      {serverError && <p className="error" role="alert">{serverError}</p>}
      <button className="btn" type="submit" aria-label={`Confirmar pedido de ${qty} sticker${qty > 1 ? 's' : ''}`}>Confirmar pedido</button>
    </form>
  );
}
