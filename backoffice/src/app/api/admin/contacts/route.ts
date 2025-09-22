import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, relation, phone, country, preferred, profileId, userId } =
      await request.json();

    if (!name || !relation || !phone) {
      return NextResponse.json(
        { error: 'Name, relation, and phone are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalProfileId = profileId;

      if (!finalProfileId) {
        const profile = await tx.emergencyProfile.create({
          data: {
            id: `profile-${Date.now()}`,
            userId,
            consentPublic: true,
            bloodType: null,
            allergies: [],
            conditions: [],
            medications: [],
            language: 'es',
            organDonor: false,
            updatedAt: new Date(),
          },
        });
        finalProfileId = profile.id;
      }

      if (preferred) {
        await tx.emergencyContact.updateMany({
          where: {
            profileId: finalProfileId,
          },
          data: {
            preferred: false,
          },
        });
      }

      const contact = await tx.emergencyContact.create({
        data: {
          id: `contact-${Date.now()}-${Math.random()}`,
          profileId: finalProfileId,
          name,
          relation,
          phone,
          country,
          preferred,
          updatedAt: new Date(),
        },
      });

      return contact;
    });

    return NextResponse.json({
      success: true,
      contact: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
