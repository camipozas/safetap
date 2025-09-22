import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/types/shared';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Create a direct Accelerate client to avoid any local caching
const accelerateClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // This ensures we use the Accelerate URL
});

/**
 * PUT - Update user
 * @param request - The request object
 * @param props - The properties object
 * @returns - The response object
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
      }

      const adminUser = await accelerateClient.user.findUnique({
        where: { email: session.user.email },
      });

      if (!adminUser || !hasPermission(adminUser.role, 'canManageUsers')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const { name, role, country, profile } = await request.json();
    const userId = params.id;

    const userToUpdate = await accelerateClient.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await accelerateClient.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(role !== undefined && { role }),
          ...(country !== undefined && { country }),
          updatedAt: new Date(), // Force timestamp update for Accelerate
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          country: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.error('User updated via Accelerate:', user);

      if (name !== undefined) {
        const stickerUpdateResult = await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            nameOnSticker: name,
            updatedAt: new Date(),
          },
        });
        console.error('Stickers updated via Accelerate:', stickerUpdateResult);
      }

      if (country !== undefined) {
        const flagUpdateResult = await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            flagCode: country,
            updatedAt: new Date(),
          },
        });
        console.error(
          'Sticker flags updated via Accelerate:',
          flagUpdateResult
        );
      }

      if (profile) {
        const emergencyProfile = await tx.emergencyProfile.findFirst({
          where: { userId },
          include: { EmergencyContact: true },
          orderBy: { updatedByUserAt: 'desc' },
        });

        if (emergencyProfile) {
          await tx.emergencyProfile.update({
            where: { id: emergencyProfile.id },
            data: {
              bloodType: profile.bloodType,
              allergies: profile.allergies,
              conditions: profile.conditions,
              medications: profile.medications,
              notes: profile.notes,
              updatedByUserAt: new Date(),
              updatedAt: new Date(),
            },
          });

          await tx.emergencyContact.deleteMany({
            where: { profileId: emergencyProfile.id },
          });

          if (profile.contacts?.length > 0) {
            await tx.emergencyContact.createMany({
              data: profile.contacts.map(
                (contact: {
                  name: string;
                  phone: string;
                  relation: string;
                  preferred?: boolean;
                }) => ({
                  id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  profileId: emergencyProfile!.id,
                  name: contact.name,
                  phone: contact.phone,
                  relation: contact.relation,
                  preferred: contact.preferred || false,
                  updatedAt: new Date(),
                })
              ),
            });
          }
        } else {
          const newProfile = await tx.emergencyProfile.create({
            data: {
              id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: userId,
              bloodType: profile.bloodType,
              allergies: profile.allergies,
              conditions: profile.conditions,
              medications: profile.medications,
              notes: profile.notes,
              language: 'es',
              organDonor: false,
              consentPublic: true,
              updatedByUserAt: new Date(),
              updatedAt: new Date(),
            },
          });

          if (profile.contacts?.length > 0) {
            await tx.emergencyContact.createMany({
              data: profile.contacts.map(
                (contact: {
                  name: string;
                  phone: string;
                  relation: string;
                  preferred?: boolean;
                }) => ({
                  id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  profileId: newProfile.id,
                  name: contact.name,
                  phone: contact.phone,
                  relation: contact.relation,
                  preferred: contact.preferred || false,
                  updatedAt: new Date(),
                })
              ),
            });
          }
        }
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully via Accelerate',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user via Accelerate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get user
 * @param request - The request object
 * @param props - The properties object
 * @returns - The response object
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userId = params.id;

    const user = await accelerateClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Sticker: true,
            Payment: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user via Accelerate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
