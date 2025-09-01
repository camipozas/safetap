import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/types/shared';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Create a direct Accelerate client to avoid any local caching
const accelerateClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // This ensures we use the Accelerate URL
});

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await accelerateClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { name, role, country } = await request.json();
    const userId = params.id;

    // Find the user to update using Accelerate directly
    const userToUpdate = await accelerateClient.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.error('🔍 Current user data via Accelerate:', {
      id: userToUpdate.id,
      name: userToUpdate.name,
      email: userToUpdate.email,
      country: userToUpdate.country,
    });

    // Use a transaction with Accelerate to ensure data consistency
    const updatedUser = await accelerateClient.$transaction(async (tx) => {
      // Update user data
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

      // If name is being updated and user has stickers, update sticker nameOnSticker too
      if (name !== undefined) {
        await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            nameOnSticker: name,
            updatedAt: new Date(),
          },
        });
      }

      // If country is being updated and user has stickers, update sticker flagCode too
      if (country !== undefined) {
        await tx.sticker.updateMany({
          where: { ownerId: userId },
          data: {
            flagCode: country,
            updatedAt: new Date(),
          },
        });
      }

      return user;
    });

    // Force cache invalidation for Accelerate is not needed with direct connection
    // await accelerateClient.$executeRaw`SELECT 1`;

    console.error('✅ User updated via Accelerate:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully via Accelerate',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        Sticker: {
          select: {
            id: true,
            nameOnSticker: true,
            flagCode: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
