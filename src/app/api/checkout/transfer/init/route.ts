import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkoutSchema } from '@/lib/validators';
import { generateSlug } from '@/lib/slug';

const bodySchema = checkoutSchema;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = bodySchema.parse(json);

    // Create or find user by email
    let user = await prisma.user.upsert({
      where: { email: data.email },
      create: { email: data.email },
      update: {},
    });

    // Create Sticker (ORDERED) and Payment (PENDING) with reference
    const reference = `SAFETAP-${generateSlug(6)}`;

    const result = await prisma.$transaction(async (tx) => {
      const sticker = await tx.sticker.create({
        data: {
          slug: generateSlug(7),
          serial: `STK-${generateSlug(8)}`,
          ownerId: user.id,
          nameOnSticker: data.nameOnSticker,
          flagCode: data.flagCode,
          stickerColor: data.stickerColor || '#f1f5f9',
          textColor: data.textColor || '#000000',
          status: 'ORDERED',
        },
      });
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          stickerId: sticker.id,
          amountCents: 1500 * data.quantity, // example price
          currency: 'EUR',
          method: 'BANK_TRANSFER',
          reference,
          status: 'PENDING',
        },
      });
      return { sticker, payment };
    });

    return NextResponse.json({ reference, paymentId: result.payment.id });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? 'Error' }, { status: 400 });
  }
}
