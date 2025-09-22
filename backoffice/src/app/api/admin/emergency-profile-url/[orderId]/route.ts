/* eslint-disable no-console */
import { NextResponse } from 'next/server';

import { getEmergencyProfileUrlForSticker } from '@/lib/emergency-profile-service';
import { prisma } from '@/lib/prisma';

interface ProfileUrlParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(req: Request, { params }: ProfileUrlParams) {
  const { orderId } = await params;

  try {
    // Find the sticker associated with this order
    const sticker = await prisma.sticker.findFirst({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    if (!sticker) {
      console.log('❌ Sticker not found for order:', orderId);
      return NextResponse.json(
        { error: 'Sticker no encontrado' },
        { status: 404 }
      );
    }

    // Get the base URL for the main application (not backoffice)
    // Use NEXT_PUBLIC_MAIN_APP_URL or fallback to production URL
    const baseUrl =
      process.env.NEXT_PUBLIC_MAIN_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://safetap.cl';

    // Get emergency profile URL
    const emergencyUrl = await getEmergencyProfileUrlForSticker(
      sticker.id,
      baseUrl
    );

    if (!emergencyUrl) {
      console.log('❌ Emergency profile not found for sticker:', sticker.id);
      return NextResponse.json(
        { error: 'Perfil de emergencia no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Emergency profile URL generated:', emergencyUrl);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      stickerId: sticker.id,
      emergencyUrl,
      stickerInfo: {
        id: sticker.id,
        slug: sticker.slug,
        status: sticker.status,
      },
    });
  } catch (e: unknown) {
    console.error('❌ Emergency profile URL generation failed:', e);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
