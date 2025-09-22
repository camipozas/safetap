import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get stickers for the user
 * @returns - The response body
 */
export async function GET() {
  try {
    console.log('🔍 API /user/stickers: Starting request...');
    const session = await auth();

    console.log('🔍 API /user/stickers: Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user?.id || !session?.user?.email) {
      console.log(
        '❌ API /user/stickers: Unauthorized - missing session or email'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userStickers = await prisma.sticker.findMany({
      where: {
        User: {
          email: session.user.email,
        },
      },
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

    console.log('🔍 API /user/stickers: Stickers found by email:', {
      userEmail: session.user.email,
      count: userStickers.length,
      stickerIds: userStickers.map((s) => s.id),
      hasEmergencyProfiles: userStickers.map((s) => ({
        id: s.id,
        hasProfile: !!s.EmergencyProfile,
      })),
    });

    const response = {
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
    };

    console.log('🔍 API /user/stickers: Final response:', {
      stickerCount: response.stickers.length,
      stickerIds: response.stickers.map((s) => s.id),
      hasEmergencyProfiles: response.stickers.map((s) => ({
        id: s.id,
        hasProfile: !!s.EmergencyProfile,
      })),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stickers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
