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
  selectedStickerIds?: string[];
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

    if (profileId) {
      // Ensure the profile belongs to the current user
      const existing = await prisma.emergencyProfile.findFirst({
        where: { id: profileId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // If selectedStickerIds is provided, validate all stickers belong to the user
      if (selectedStickerIds && selectedStickerIds.length > 0) {
        const userStickers = await prisma.sticker.findMany({
          where: {
            id: { in: selectedStickerIds },
            ownerId: user.id,
          },
          select: { id: true },
        });

        if (userStickers.length !== selectedStickerIds.length) {
          return NextResponse.json(
            { error: 'Algunos stickers no pertenecen al usuario' },
            { status: 403 }
          );
        }
      }

      const updated = await prisma.emergencyProfile.update({
        where: { id: profileId },
        data: {
          ...data,
          updatedByUserAt: new Date(),
          EmergencyContact: {
            deleteMany: { profileId },
            create: data.contacts.map((contact) => ({
              id: crypto.randomUUID(),
              ...contact,
              updatedAt: new Date(),
            })),
          },
        },
      });

      // If selectedStickerIds is provided, update/create individual profiles for each selected sticker
      if (selectedStickerIds && selectedStickerIds.length > 0) {
        // Get stickers that don't have the current profile assigned
        const stickersToUpdate = await prisma.sticker.findMany({
          where: {
            id: { in: selectedStickerIds },
            ownerId: user.id,
          },
          include: {
            EmergencyProfile: true,
          },
        });

        // Update or create profiles for each selected sticker
        for (const sticker of stickersToUpdate) {
          if (sticker.EmergencyProfile) {
            // Update existing profile for this sticker
            await prisma.emergencyProfile.update({
              where: { id: sticker.EmergencyProfile.id },
              data: {
                ...data,
                updatedByUserAt: new Date(),
                EmergencyContact: {
                  deleteMany: { profileId: sticker.EmergencyProfile.id },
                  create: data.contacts.map((contact) => ({
                    id: crypto.randomUUID(),
                    ...contact,
                    updatedAt: new Date(),
                  })),
                },
              },
            });
          } else {
            // Create new profile for this sticker
            await prisma.emergencyProfile.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                stickerId: sticker.id,
                ...data,
                updatedByUserAt: new Date(),
                updatedAt: new Date(),
                EmergencyContact: {
                  create: data.contacts.map((contact) => ({
                    id: crypto.randomUUID(),
                    ...contact,
                    updatedAt: new Date(),
                  })),
                },
              },
            });
          }
        }
      }

      return NextResponse.json({ id: updated.id });
    }

    // Creating new profile: if linking to a sticker, validate sticker ownership
    if (stickerId) {
      const sticker = await prisma.sticker.findFirst({
        where: { id: stickerId, ownerId: user.id },
      });
      if (!sticker) {
        return NextResponse.json(
          { error: 'Sticker no encontrado' },
          { status: 404 }
        );
      }
    }

    const created = await prisma.emergencyProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        stickerId,
        ...data,
        updatedAt: new Date(),
        EmergencyContact: {
          create: data.contacts.map((contact) => ({
            id: crypto.randomUUID(),
            ...contact,
            updatedAt: new Date(),
          })),
        },
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
