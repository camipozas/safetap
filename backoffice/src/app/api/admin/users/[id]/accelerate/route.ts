import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Create a direct Accelerate connection bypassing local cache
async function createDirectAccelerateClient() {
  const { PrismaClient } = await import('@prisma/client');

  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL!, // Direct Accelerate URL
      },
    },
  });
}

/**
 * PUT - Update user in Accelerate
 * @param request - The request object
 * @param props - The properties object
 * @returns - The response object
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  let directPrisma;

  try {
    directPrisma = await createDirectAccelerateClient();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await directPrisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { name, role, country } = await request.json();
    const userId = params.id;

    const userToUpdate = await directPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.warn('🔄 Updating user directly in Accelerate:', {
      userId,
      currentName: userToUpdate.name,
      newName: name,
      currentCountry: userToUpdate.country,
      newCountry: country,
    });

    const updatedUser = await directPrisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(role !== undefined && { role }),
          ...(country !== undefined && { country }),
          updatedAt: new Date(), // Force timestamp update
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

      if (name !== undefined) {
        const stickerUpdateResult = await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            nameOnSticker: name,
            updatedAt: new Date(),
          },
        });
        console.warn(
          `📋 Updated ${stickerUpdateResult.count} stickers with new name`
        );
      }

      if (country !== undefined) {
        const stickerCountryResult = await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            flagCode: country,
            updatedAt: new Date(),
          },
        });
        console.warn(
          `🌍 Updated ${stickerCountryResult.count} stickers with new country`
        );
      }

      return user;
    });

    const verifyUser = await directPrisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        country: true,
        updatedAt: true,
      },
    });

    console.warn('✅ Verification from Accelerate:', {
      name: verifyUser?.name,
      country: verifyUser?.country,
      updatedAt: verifyUser?.updatedAt,
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully in Accelerate',
      user: updatedUser,
      verification: verifyUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error updating user in Accelerate:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    if (directPrisma) {
      await directPrisma.$disconnect();
    }
  }
}

/**
 * GET - Get user in Accelerate
 * @param request - The request object
 * @param props - The properties object
 * @returns - The response object
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  let directPrisma;

  try {
    const userId = params.id;

    directPrisma = await createDirectAccelerateClient();

    const user = await directPrisma.user.findUnique({
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

    console.warn('📖 Reading user directly from Accelerate:', {
      email: user.email,
      name: user.name,
      country: user.country,
      updatedAt: user.updatedAt,
    });

    return NextResponse.json({
      user,
      source: 'direct-accelerate',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching user from Accelerate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (directPrisma) {
      await directPrisma.$disconnect();
    }
  }
}
