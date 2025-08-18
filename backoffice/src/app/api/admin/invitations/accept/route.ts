import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Buscar la invitación
    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Token de invitación no válido' },
        { status: 404 }
      );
    }

    // Verificar si ya fue usada
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: 'Esta invitación ya ha sido utilizada' },
        { status: 400 }
      );
    }

    // Verificar si ha expirado
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe en el sistema' },
        { status: 400 }
      );
    }

    // Crear el usuario y marcar la invitación como usada en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el nuevo usuario administrador
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          role: invitation.role,
          name: invitation.email.split('@')[0], // Nombre temporal basado en el email
        },
      });

      // Marcar la invitación como usada
      await tx.adminInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    console.log(
      `✅ Nuevo administrador creado: ${result.email} (${result.role})`
    );

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
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
