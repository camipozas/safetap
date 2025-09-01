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

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  let directPrisma;

  try {
    // Create direct Accelerate connection
    directPrisma = await createDirectAccelerateClient();

    // Authentication check using regular prisma
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions using direct connection
    const adminUser = await directPrisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { name, role, country } = await request.json();
    const userId = params.id;

    // Find the user to update using direct connection
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

    // Use a transaction directly in Accelerate to ensure data consistency
    const updatedUser = await directPrisma.$transaction(async (tx) => {
      // Update user data with force refresh
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

      // If name is being updated and user has stickers, update sticker nameOnSticker too
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

      // If country is being updated and user has stickers, update sticker flagCode too
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

    // Force a direct read from Accelerate to verify the update
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
    // Clean up direct connection
    if (directPrisma) {
      await directPrisma.$disconnect();
    }
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  let directPrisma;

  try {
    const userId = params.id;

    // Create direct Accelerate connection for read
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
    // Clean up direct connection
    if (directPrisma) {
      await directPrisma.$disconnect();
    }
  }
}
