import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validators';
import { z } from 'zod';

type ProfileValues = z.infer<typeof profileSchema>;

interface RequestBody {
  stickerId?: string;
  profileId?: string;
  values: ProfileValues;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const json = await req.json();
    const { stickerId, profileId, values } = json as RequestBody;
    const data = profileSchema.parse(values);

    if (profileId) {
      // Ensure the profile belongs to the current user
      const existing = await prisma.emergencyProfile.findFirst({ where: { id: profileId, userId: user.id } });
      if (!existing) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

      const updated = await prisma.emergencyProfile.update({
        where: { id: profileId },
        data: {
          ...data,
          updatedByUserAt: new Date(),
          contacts: {
            deleteMany: { profileId },
            create: data.contacts,
          },
        },
      });
      return NextResponse.json({ id: updated.id });
    }

    // Creating new profile: if linking to a sticker, validate sticker ownership
    if (stickerId) {
      const sticker = await prisma.sticker.findFirst({ where: { id: stickerId, ownerId: user.id } });
      if (!sticker) return NextResponse.json({ error: 'Sticker no encontrado' }, { status: 404 });
    }

    const created = await prisma.emergencyProfile.create({
      data: {
        userId: user.id,
        stickerId: stickerId,
        ...data,
        contacts: { create: data.contacts },
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
