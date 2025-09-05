import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile/templates - Obtener templates del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el perfil de emergencia del usuario (solo uno, optimizado)
    const emergencyProfile = await prisma.emergencyProfile.findFirst({
      where: { userId: session.user.id },
      include: {
        EmergencyContact: true,
      },
      orderBy: { updatedByUserAt: 'desc' },
    });

    // Obtener todos los stickers del usuario para extraer diseños únicos
    const userStickers = await prisma.sticker.findMany({
      where: { ownerId: session.user.id },
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
      where: { userId: session.user.id },
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

    return NextResponse.json({
      // Datos médicos y contactos (únicos del usuario)
      emergencyProfile: emergencyProfile
        ? {
            id: emergencyProfile.id,
            bloodType: emergencyProfile.bloodType,
            allergies: emergencyProfile.allergies,
            conditions: emergencyProfile.conditions,
            medications: emergencyProfile.medications,
            notes: emergencyProfile.notes,
            language: emergencyProfile.language,
            organDonor: emergencyProfile.organDonor,
            insurance: emergencyProfile.insurance,
            consentPublic: emergencyProfile.consentPublic,
            contacts: emergencyProfile.EmergencyContact.map((contact) => ({
              id: contact.id,
              name: contact.name,
              relation: contact.relation,
              phone: contact.phone,
              country: contact.country,
              preferred: contact.preferred,
            })),
          }
        : null,
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
    });
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
