import { randomUUID } from 'crypto';

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

    const data = profileSchema.parse(values);

    // Separate contacts from other profile data
    const { contacts, ...profileData } = data;

    // MODO INDIVIDUAL: actualizar o crear perfil para un sticker específico
    if (stickerId && profileId) {
      // Verificar que el perfil existe y pertenece al usuario
      const existing = await prisma.emergencyProfile.findFirst({
        where: {
          id: profileId,
          userId: user.id,
        },
        include: {
          EmergencyContact: true,
        },
      });

      if (!existing) {
        return NextResponse.json(
          {
            error: 'Perfil no encontrado o no autorizado',
          },
          { status: 403 }
        );
      }

      // Si el perfil pertenece al mismo sticker, actualizarlo
      if (existing.stickerId === stickerId) {
        const updated = await prisma.emergencyProfile.update({
          where: { id: profileId },
          data: {
            ...profileData,
            updatedByUserAt: new Date(),
            EmergencyContact: {
              deleteMany: { profileId },
              create: contacts.map((contact) => ({
                id: randomUUID(),
                ...contact,
                updatedAt: new Date(),
              })),
            },
          },
        });

        return NextResponse.json({ id: updated.id });
      } else {
        // Si el perfil pertenece a otro sticker o es general, usar como template para crear uno nuevo
        console.log(
          `🔄 Using profile ${profileId} as template for new sticker ${stickerId}`
        );

        const newProfile = await prisma.emergencyProfile.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            stickerId, // Asociar al nuevo sticker
            ...profileData,
            updatedAt: new Date(),
            updatedByUserAt: new Date(),
            EmergencyContact: {
              create: contacts.map((contact) => ({
                id: randomUUID(),
                ...contact,
                updatedAt: new Date(),
              })),
            },
          },
        });

        return NextResponse.json({ id: newProfile.id });
      }
    }

    // MODO INDIVIDUAL: crear nuevo perfil para un sticker específico
    if (stickerId && !profileId) {
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
