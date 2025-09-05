import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validators';

type ProfileValues = z.infer<typeof profileSchema>;

interface RequestBody {
  stickerId?: string;
  profileId?: string;
  values: ProfileValues;
  selectedStickerIds?: string[]; // Para operaciones en múltiples stickers
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { stickerId, profileId, values, selectedStickerIds } =
      json as RequestBody;

    // Debug logs temporales
    console.log('=== PROFILE API DEBUG ===');
    console.log('stickerId:', stickerId);
    console.log('profileId:', profileId);
    console.log('selectedStickerIds:', selectedStickerIds);
    console.log(
      'Modo:',
      stickerId
        ? 'INDIVIDUAL'
        : selectedStickerIds?.length
          ? 'MÚLTIPLE'
          : 'CREAR NUEVO'
    );
    console.log('Datos recibidos en API:', JSON.stringify(values, null, 2));

    const data = profileSchema.parse(values);

    // Separate contacts from other profile data
    const { contacts, ...profileData } = data;

    // MODO INDIVIDUAL: actualizar perfil específico de un sticker
    if (stickerId && profileId) {
      console.log('Modo INDIVIDUAL - Actualizando perfil existente');

      // Verificar que el perfil existe y pertenece al usuario y al sticker correcto
      const existing = await prisma.emergencyProfile.findFirst({
        where: {
          id: profileId,
          userId: user.id,
          stickerId, // Asegurar que es el perfil del sticker correcto
        },
      });

      if (!existing) {
        return NextResponse.json(
          {
            error: 'Perfil no encontrado o no autorizado para este sticker',
          },
          { status: 403 }
        );
      }

      console.log(
        'Actualizando perfil:',
        profileId,
        'para sticker:',
        stickerId
      );

      // Update the profile
      const updated = await prisma.emergencyProfile.update({
        where: { id: profileId },
        data: {
          ...profileData,
          updatedByUserAt: new Date(),
          EmergencyContact: {
            deleteMany: { profileId },
            create: contacts.map((contact) => ({
              id: crypto.randomUUID(),
              ...contact,
              updatedAt: new Date(),
            })),
          },
        },
      });

      return NextResponse.json({ id: updated.id });
    }

    // MODO INDIVIDUAL: crear nuevo perfil para un sticker específico
    if (stickerId && !profileId) {
      console.log('Modo INDIVIDUAL - Creando nuevo perfil');

      const sticker = await prisma.sticker.findFirst({
        where: { id: stickerId, ownerId: user.id },
      });
      if (!sticker) {
        return NextResponse.json(
          { error: 'Sticker no encontrado' },
          { status: 404 }
        );
      }

      const created = await prisma.emergencyProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          stickerId,
          ...profileData,
          updatedAt: new Date(),
          EmergencyContact: {
            create: contacts.map((contact) => ({
              id: crypto.randomUUID(),
              ...contact,
              updatedAt: new Date(),
            })),
          },
        },
      });

      return NextResponse.json({ id: created.id });
    }

    // MODO MÚLTIPLE: crear/actualizar perfiles individuales para cada sticker seleccionado
    if (selectedStickerIds && selectedStickerIds.length > 0) {
      console.log(
        'Modo MÚLTIPLE - Actualizando',
        selectedStickerIds.length,
        'stickers'
      );

      // Validar que todos los stickers pertenecen al usuario
      const userStickers = await prisma.sticker.findMany({
        where: {
          id: { in: selectedStickerIds },
          ownerId: user.id,
        },
        include: {
          EmergencyProfile: true,
        },
      });

      if (userStickers.length !== selectedStickerIds.length) {
        return NextResponse.json(
          { error: 'Algunos stickers no pertenecen al usuario' },
          { status: 403 }
        );
      }

      const results = [];

      // Crear/actualizar perfil individual para cada sticker seleccionado
      for (const sticker of userStickers) {
        if (sticker.EmergencyProfile) {
          // Actualizar perfil existente para este sticker específico
          const updated = await prisma.emergencyProfile.update({
            where: { id: sticker.EmergencyProfile.id },
            data: {
              ...profileData,
              updatedByUserAt: new Date(),
              EmergencyContact: {
                deleteMany: { profileId: sticker.EmergencyProfile.id },
                create: contacts.map((contact) => ({
                  id: crypto.randomUUID(),
                  ...contact,
                  updatedAt: new Date(),
                })),
              },
            },
          });
          results.push({
            stickerId: sticker.id,
            profileId: updated.id,
            action: 'updated',
          });
        } else {
          // Crear nuevo perfil individual para este sticker
          const created = await prisma.emergencyProfile.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              stickerId: sticker.id,
              ...profileData,
              updatedAt: new Date(),
              EmergencyContact: {
                create: contacts.map((contact) => ({
                  id: crypto.randomUUID(),
                  ...contact,
                  updatedAt: new Date(),
                })),
              },
            },
          });
          results.push({
            stickerId: sticker.id,
            profileId: created.id,
            action: 'created',
          });
        }
      }

      return NextResponse.json({
        message: `Perfiles actualizados/creados para ${results.length} stickers`,
        results,
      });
    }

    // Si llegamos aquí, no se especificó ni stickerId ni selectedStickerIds
    return NextResponse.json(
      {
        error: 'Debe especificar un sticker individual o una lista de stickers',
      },
      { status: 400 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
