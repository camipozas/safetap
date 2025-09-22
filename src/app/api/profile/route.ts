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
  selectedStickerIds?: string[];
}

/**
 * Create or update a profile
 * @param req - The request body
 * @returns - The response body
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { stickerId, profileId, values, selectedStickerIds } =
      json as RequestBody;

    const data = profileSchema.parse(values);

    const { contacts, ...profileData } = data;

    if (stickerId && profileId) {
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
            error: 'Profile not found or unauthorized',
          },
          { status: 403 }
        );
      }

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
        console.log(
          `🔄 Using profile ${profileId} as template for new sticker ${stickerId}`
        );

        const newProfile = await prisma.emergencyProfile.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            stickerId,
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

    if (selectedStickerIds && selectedStickerIds.length > 0) {
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

      for (const sticker of userStickers) {
        if (sticker.EmergencyProfile) {
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

    return NextResponse.json(
      {
        error: 'Debe especificar un sticker individual o una lista de stickers',
      },
      { status: 400 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
