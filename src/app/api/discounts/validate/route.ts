import { NextResponse } from 'next/server';
import { z } from 'zod';

import { applyDiscount } from '@/lib/discounts/applyDiscount';

const validateDiscountSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  cartTotal: z.number().min(0, 'Total del carrito debe ser mayor a 0'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = validateDiscountSchema.parse(json);

    const result = await applyDiscount({
      code: data.code,
      cartTotal: data.cartTotal,
      preview: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating discount:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          message: error.issues[0]?.message ?? 'Datos inválidos',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
