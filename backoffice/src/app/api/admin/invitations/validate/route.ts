import { prisma } from '@/lib/prisma';
import { USER_ROLES } from '@/types/shared';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

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
    }

    return NextResponse.json({
      isValid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
