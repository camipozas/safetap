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

    let finalProfileId = profileId;

    if (!finalProfileId) {
      const profile = await prisma.emergencyProfile.create({
        data: {
          userId,
          consentPublic: true,
        },
      });
      finalProfileId = profile.id;
    }

    if (preferred) {
      await prisma.emergencyContact.updateMany({
        where: {
          profileId: finalProfileId,
        },
        data: {
          preferred: false,
        },
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        profileId: finalProfileId,
        name,
        relation,
        phone,
        country,
        preferred,
      },
    });

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
