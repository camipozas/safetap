import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stickerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { stickerId } = await params;

    // Verificar que el sticker pertenece al usuario
    const sticker = await prisma.sticker.findFirst({
      where: {
        id: stickerId,
        owner: { email: session.user.email },
      },
    });

    if (!sticker) {
      return NextResponse.json(
        { error: 'Sticker no encontrado' },
        { status: 404 }
      );
    }

    // Solo permitir activación si está en estado SHIPPED
    if (sticker.status !== 'SHIPPED') {
      return NextResponse.json(
        {
          error:
            'El sticker debe estar en estado "Enviado" para poder activarse',
        },
        { status: 400 }
      );
    }

    // Activar el sticker
    await prisma.sticker.update({
      where: { id: stickerId },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error activating sticker:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
