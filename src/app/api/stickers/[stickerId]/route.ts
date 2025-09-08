import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateStickerSchema = z.object({
  nameOnSticker: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre es muy largo'),
  flagCode: z.string().optional(),
  colorPresetId: z.string().optional(),
  stickerColor: z.string().optional(),
  textColor: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ stickerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const data = updateStickerSchema.parse(body);

    // Verificar que el sticker pertenece al usuario
    const sticker = await prisma.sticker.findFirst({
      where: {
        id: resolvedParams.stickerId,
        ownerId: session.user.id,
      },
    });

    if (!sticker) {
      return NextResponse.json(
        { error: 'Sticker no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el sticker
    const updatedSticker = await prisma.sticker.update({
      where: { id: resolvedParams.stickerId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedSticker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error updating sticker:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
