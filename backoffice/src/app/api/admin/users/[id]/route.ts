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

    const { name, role, country } = await request.json();
    const userId = params.id;

    const userToUpdate = await accelerateClient.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

      console.error('User updated via Accelerate:', user);

      // If name is being updated and user has stickers, update sticker nameOnSticker too
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

      // If country is being updated and user has stickers, update sticker flagCode too
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
            stickers: true,
            payments: true,
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
