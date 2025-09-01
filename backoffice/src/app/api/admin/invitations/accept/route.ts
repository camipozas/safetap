import { prisma } from '@/lib/prisma';
import { USER_ROLES } from '@/types/shared';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Token de invitación no válido' },
        { status: 404 }
      );
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: 'Esta invitación ya ha sido utilizada' },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      if (
        existingUser.role === USER_ROLES.ADMIN ||
        existingUser.role === USER_ROLES.SUPER_ADMIN
      ) {
        return NextResponse.json(
          { error: 'El usuario ya es administrador en el sistema' },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { email: invitation.email },
          data: { role: invitation.role },
        });

        await tx.adminInvitation.update({
          where: { id: invitation.id },
          data: { usedAt: new Date() },
        });

        return updatedUser;
      });

      return NextResponse.json({
        success: true,
        message: `Rol de administrador asignado exitosamente a ${result.email}`,
        user: {
          id: result.id,
          email: result.email,
          role: result.role,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          role: invitation.role,
          name: invitation.email.split('@')[0],
        } as any,
      });

      await tx.adminInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: `Cuenta de administrador creada exitosamente para ${result.email}`,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
