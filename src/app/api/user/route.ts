import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const userUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo'),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  try {
    const json = await req.json();
    const { name } = userUpdateSchema.parse(json);

    // Update user name
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        updatedAt: new Date(),
      },
    });

    // Also update nameOnSticker for all stickers owned by this user
    await prisma.sticker.updateMany({
      where: { ownerId: user.id },
      data: {
        nameOnSticker: name,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
