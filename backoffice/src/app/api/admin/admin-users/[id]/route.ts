import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageAdmins } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { role } = await request.json();
    const { id } = params;

    if (!role) {
      return NextResponse.json({ error: 'Rol es requerido' }, { status: 400 });
    }

    // Prevent self-demotion from SUPER_ADMIN
    if (
      user.id === id &&
      user.role === 'SUPER_ADMIN' &&
      role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol de SUPER_ADMIN' },
        { status: 400 }
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

    const { id } = params;

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio acceso de admin' },
        { status: 400 }
      );
    }

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
