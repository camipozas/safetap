import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/stickers - Obtener stickers del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userStickers = await prisma.sticker.findMany({
      where: { ownerId: session.user.id },
      include: {
        EmergencyProfile: {
          select: {
            id: true,
            bloodType: true,
            allergies: true,
            conditions: true,
            medications: true,
            insurance: true,
            organDonor: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      stickers: userStickers.map((sticker) => ({
        id: sticker.id,
        nameOnSticker: sticker.nameOnSticker,
        flagCode: sticker.flagCode,
        colorPresetId: sticker.colorPresetId,
        stickerColor: sticker.stickerColor,
        textColor: sticker.textColor,
        createdAt: sticker.createdAt,
        EmergencyProfile: sticker.EmergencyProfile,
      })),
    });
  } catch (error) {
    console.error('Error fetching user stickers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
