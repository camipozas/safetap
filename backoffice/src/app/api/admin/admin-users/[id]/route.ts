import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { USER_ROLES, canManageAdmins } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let currentUser: { role: string; id: string } | null = null;

    if (
      process.env.NODE_ENV === 'development' &&
      process.env.ENABLE_DEV_SUPER_ADMIN === 'true'
    ) {
      currentUser = { role: USER_ROLES.SUPER_ADMIN, id: 'dev-user' };
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, id: true },
      });

      if (!user || !canManageAdmins(user.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      currentUser = user;
    }

    const { role } = await request.json();
    const { id } = params;

    if (!role) {
      return NextResponse.json({ error: 'Rol es requerido' }, { status: 400 });
    }

    // Prevent self-demotion from SUPER_ADMIN
    if (
      currentUser.id === id &&
      currentUser.role === USER_ROLES.SUPER_ADMIN &&
      role !== USER_ROLES.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol de SUPER_ADMIN' },
        { status: 400 }
      );
    }

    // Only SUPER_ADMIN can promote to SUPER_ADMIN
    if (
      role === USER_ROLES.SUPER_ADMIN &&
      currentUser.role !== USER_ROLES.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Solo Super Admins pueden promover a otros a Super Admin' },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.ENABLE_DEV_SUPER_ADMIN === 'true'
    ) {
      // En desarrollo, permitir eliminación directa solo si está explícitamente habilitado
      console.log(
        '🚀 Development mode: Bypassing authentication for user deletion (ENABLE_DEV_SUPER_ADMIN=true)'
      );
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, id: true },
      });

      if (!user || !canManageAdmins(user.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // Prevent self-deletion
      if (user.id === params.id) {
        return NextResponse.json(
          { error: 'No puedes eliminar tu propio acceso de admin' },
          { status: 400 }
        );
      }
    }

    const { id } = params;

    // Set role back to USER instead of deleting
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: 'USER' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
