import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile/templates - Obtener templates del usuario
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el parámetro de exclusión desde query params
    const { searchParams } = new URL(request.url);
    const excludeStickerId = searchParams.get('excludeStickerId');

    // Obtener perfiles de emergencia usando una query optimizada que busca por email
    const allUserProfiles = await prisma.emergencyProfile.findMany({
      where: {
        User: {
          email: session.user.email,
        },
      },
      include: {
        EmergencyContact: true,
        Sticker: {
          select: {
            id: true,
            nameOnSticker: true,
            flagCode: true,
          },
        },
      },
      orderBy: { updatedByUserAt: 'desc' },
    });

    // Separar entre perfil general y perfiles de stickers específicos
    const emergencyProfile = allUserProfiles.find(
      (profile) => !profile.stickerId
    );

    // Si no hay perfil general pero sí hay perfiles de stickers, usar el más reciente como base
    const fallbackEmergencyProfile =
      !emergencyProfile && allUserProfiles.length > 0
        ? allUserProfiles[0] // El más reciente por el orderBy
        : null;

    const stickerProfiles = allUserProfiles.filter(
      (profile) => profile.stickerId && profile.stickerId !== excludeStickerId
    );

    // Obtener todos los stickers del usuario para extraer diseños únicos
    const userStickers = await prisma.sticker.findMany({
      where: {
        User: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
        nameOnSticker: true,
        flagCode: true,
        colorPresetId: true,
        stickerColor: true,
        textColor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener diseños guardados explícitamente
    const stickerDesigns = await prisma.stickerDesign.findMany({
      where: {
        User: {
          email: session.user.email,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Crear templates únicos de diseño basados en stickers existentes
    const stickerTemplates = userStickers.map((sticker) => ({
      id: `sticker-${sticker.id}`,
      name: `Diseño ${sticker.nameOnSticker}`,
      nameOnSticker: sticker.nameOnSticker,
      flagCode: sticker.flagCode,
      colorPresetId: sticker.colorPresetId,
      stickerColor: sticker.stickerColor,
      textColor: sticker.textColor,
      isTemplate: false,
    }));

    const response = {
      emergencyProfile:
        emergencyProfile || fallbackEmergencyProfile
          ? {
              id: (emergencyProfile || fallbackEmergencyProfile)!.id,
              name: emergencyProfile
                ? 'Mi perfil general'
                : `Perfil de ${fallbackEmergencyProfile!.Sticker?.nameOnSticker || 'Sticker'}`,
              bloodType: (emergencyProfile || fallbackEmergencyProfile)!
                .bloodType,
              allergies: (emergencyProfile || fallbackEmergencyProfile)!
                .allergies,
              conditions: (emergencyProfile || fallbackEmergencyProfile)!
                .conditions,
              medications: (emergencyProfile || fallbackEmergencyProfile)!
                .medications,
              notes: (emergencyProfile || fallbackEmergencyProfile)!.notes,
              language: (emergencyProfile || fallbackEmergencyProfile)!
                .language,
              organDonor: (emergencyProfile || fallbackEmergencyProfile)!
                .organDonor,
              insurance: (emergencyProfile || fallbackEmergencyProfile)!
                .insurance,
              consentPublic: (emergencyProfile || fallbackEmergencyProfile)!
                .consentPublic,
              contacts: (emergencyProfile ||
                fallbackEmergencyProfile)!.EmergencyContact.map((contact) => ({
                id: contact.id,
                name: contact.name,
                relation: contact.relation,
                phone: contact.phone,
                country: contact.country || undefined,
                preferred: contact.preferred,
              })),
            }
          : null,
      // Perfiles de otros stickers como templates
      stickerProfileTemplates: stickerProfiles.map((profile) => ({
        id: profile.id,
        name: `Perfil de ${profile.Sticker?.nameOnSticker || 'Sticker'}`,
        stickerName: profile.Sticker?.nameOnSticker,
        stickerFlagCode: profile.Sticker?.flagCode,
        bloodType: profile.bloodType,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medications: profile.medications,
        notes: profile.notes,
        language: profile.language,
        organDonor: profile.organDonor,
        insurance: profile.insurance,
        consentPublic: profile.consentPublic,
        contacts: profile.EmergencyContact.map((contact) => ({
          id: contact.id,
          name: contact.name,
          relation: contact.relation,
          phone: contact.phone,
          country: contact.country || undefined,
          preferred: contact.preferred,
        })),
      })),
      // Templates de diseño de stickers
      stickerTemplates,
      // Diseños guardados explícitamente
      stickerDesigns: stickerDesigns.map((design) => ({
        id: design.id,
        name: design.name,
        nameOnSticker: design.nameOnSticker,
        flagCode: design.flagCode,
        colorPresetId: design.colorPresetId,
        stickerColor: design.stickerColor,
        textColor: design.textColor,
        isTemplate: design.isTemplate,
      })),
    };

    console.log('🔍 API /profile/templates: Final response:', {
      hasEmergencyProfile: !!response.emergencyProfile,
      stickerProfileTemplatesCount: response.stickerProfileTemplates.length,
      profileSource: emergencyProfile
        ? 'general'
        : fallbackEmergencyProfile
          ? 'sticker-based'
          : 'none',
      totalUserProfiles: allUserProfiles.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/profile/templates - Guardar nuevo template de diseño
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      nameOnSticker,
      flagCode,
      colorPresetId,
      stickerColor,
      textColor,
      isTemplate,
    } = body;

    const stickerDesign = await prisma.stickerDesign.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        name,
        nameOnSticker,
        flagCode,
        colorPresetId,
        stickerColor,
        textColor,
        isTemplate: isTemplate || false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: stickerDesign.id,
      message: 'Diseño guardado exitosamente',
    });
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
