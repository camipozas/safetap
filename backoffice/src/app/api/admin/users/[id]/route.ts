import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

      const adminUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!adminUser || !hasPermission(adminUser.role, 'canManageUsers')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const { name, role, country } = await request.json();
    const userId = params.id;

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(country !== undefined && { country }),
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

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
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

    const user = await prisma.user.findUnique({
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
