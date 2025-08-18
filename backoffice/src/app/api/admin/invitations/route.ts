import { authOptions } from '@/lib/auth';
import { createEmailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Obtener invitaciones pendientes
export async function GET() {
  try {
    if (process.env.NODE_ENV === 'development') {
      const invitations = await prisma.adminInvitation.findMany({
        where: {
          expiresAt: {
            gte: new Date(),
          },
          usedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ invitations });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !hasPermission(user.role, 'canManageAdmins')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const invitations = await prisma.adminInvitation.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
        },
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva invitación
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'development') {
      // En desarrollo, permitir creación directa
      // eslint-disable-next-line no-console
      console.log(
        '🚀 Development mode: Bypassing authentication for invitation creation'
      );
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || !hasPermission(user.role, 'canManageAdmins')) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }

      // Solo SUPER_ADMIN puede crear otros SUPER_ADMIN
      if (role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Solo Super Admins pueden crear otros Super Admins' },
          { status: 403 }
        );
      }
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El usuario ya existe en el sistema' },
        { status: 400 }
      );
    }

    // Verificar si ya hay una invitación pendiente
    const existingInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email,
        expiresAt: {
          gte: new Date(),
        },
        usedAt: null,
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      );
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Crear la invitación
    const invitation = await prisma.adminInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
      },
    });

    // Generar URL de invitación
    const baseUrl =
      process.env.NEXTAUTH_BACKOFFICE_URL || 'http://localhost:3001';
    const inviteUrl = `${baseUrl}/auth/accept-invitation?token=${token}`;

    const emailService = createEmailService();
    let emailSent = false;
    let emailError: string | null = null;

    if (emailService) {
      try {
        const messageId = await emailService.sendInvitationEmail(
          email,
          inviteUrl,
          role
        );
        console.log(`✅ Invitation email sent successfully:`, messageId);
        emailSent = true;
      } catch (error) {
        console.error('❌ Failed to send invitation email:', error);
        emailError = error instanceof Error ? error.message : 'Unknown error';
        // Don't fail the invitation creation if email fails
      }
    } else {
      console.warn(
        '⚠️ Email service not configured. Invitation created but email not sent.'
      );
      emailError = 'Email service not configured';
    }

    // Log invitation details for development/debugging
    console.log(`📧 Invitación para ${email}:`);
    console.log(`🔗 Link: ${inviteUrl}`);
    console.log(`⏰ Expira: ${expiresAt.toISOString()}`);
    console.log(`📮 Email enviado: ${emailSent ? 'Sí' : 'No'}`);

    const responseData: Record<string, unknown> = {
      success: true,
      invitation,
      message: `Invitación creada para ${email}`,
      emailSent,
    };

    // Include invite URL for development or if email failed
    if (process.env.NODE_ENV === 'development' || !emailSent) {
      responseData.inviteUrl = inviteUrl;
      if (!emailSent && emailError) {
        responseData.emailError = emailError;
        responseData.warning =
          'Invitación creada pero el email no pudo ser enviado. Usar el enlace de invitación manual.';
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
