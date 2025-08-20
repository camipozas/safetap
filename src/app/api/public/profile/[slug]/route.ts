import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const base = await prisma.emergencyProfile.findFirst({
    where: { sticker: { slug: resolvedParams.slug }, consentPublic: true },
    select: {
      id: true,
      bloodType: true,
      allergies: true,
      conditions: true,
      medications: true,
      notes: true,
    },
  });
  if (!base) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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
