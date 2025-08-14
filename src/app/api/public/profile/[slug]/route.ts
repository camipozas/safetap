import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const base = await prisma.emergencyProfile.findFirst({
    where: { sticker: { slug: params.slug }, consentPublic: true },
    select: {
      id: true,
      bloodType: true,
      allergies: true,
      conditions: true,
      medications: true,
      notes: true,
    },
  });
  if (!base) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const contacts = await prisma.emergencyContact.findMany({
    where: { profileId: base.id },
    orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
    select: { name: true, relation: true, phone: true, preferred: true },
  });

  await prisma.profileAccessLog.create({ data: { profileId: base.id, via: 'DIRECT' } });

  return NextResponse.json({
    bloodType: base.bloodType,
    allergies: base.allergies,
    conditions: base.conditions,
    medications: base.medications,
    notes: base.notes,
    contacts,
  });
}
