import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAdmins, USER_ROLES } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Bypass authentication in development
    if (process.env.NODE_ENV === 'development') {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(adminUsers);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || !canManageAdmins(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(adminUsers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || !canManageAdmins(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (targetUser) {
      // Update existing user's role
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      return NextResponse.json(updatedUser);
    } else {
      // Create new user with admin role
      const newUser = await prisma.user.create({
        data: {
          email,
          role,
          name: null, // Will be filled when they first login
          id: `user-${email}-id`,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });
      return NextResponse.json(newUser);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
