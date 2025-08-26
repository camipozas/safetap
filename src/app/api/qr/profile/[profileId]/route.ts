import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

interface ProfileUrlParams {
  params: Promise<{ profileId: string }>;
}

export async function GET(req: Request, { params }: ProfileUrlParams) {
  const { profileId } = await params;

  try {
    console.log('🔍 Looking for profile URL:', profileId);

    // Find the profile and ensure it's public and has confirmed payment
    const profile = await prisma.emergencyProfile.findFirst({
      where: {
        id: profileId,
        consentPublic: true,
        Sticker: {
          status: 'ACTIVE',
          Payment: {
            some: {
              status: {
                in: ['TRANSFER_PAYMENT', 'VERIFIED', 'PAID', 'TRANSFERRED'],
              },
            },
          },
        },
      },
      include: {
        Sticker: {
          select: {
            id: true,
            slug: true,
            serial: true,
            status: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!profile || !profile.Sticker) {
      console.log('❌ Profile not found or not active:', profileId);
      return NextResponse.json(
        { error: 'Perfil no encontrado o no activo' },
        { status: 404 }
      );
    }

    // Generate the personalized QR URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://safetap.cl';
    const qrUrl = `${baseUrl}/qr/${profileId}`;

    console.log('✅ Profile URL generated:', qrUrl);

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      qrUrl,
      stickerInfo: {
        id: profile.Sticker.id,
        slug: profile.Sticker.slug,
        serial: profile.Sticker.serial,
        status: profile.Sticker.status,
      },
      userInfo: {
        name: profile.User.name,
        email: profile.User.email,
      },
      isPublic: profile.consentPublic,
    });
  } catch (e: unknown) {
    console.error('❌ Profile URL generation failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
