import { authOptions } from '@/lib/auth';
import { createEmailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { USER_ROLES, hasPermission } from '@/types/shared';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
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

export async function POST(request: NextRequest) {
  console.log('📨 Starting invitation creation process');
  try {
    const { email, role } = await request.json();
    console.log('📥 Invitation request data:', { email, role });

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email y rol son requeridos' },
        { status: 400 }
      );
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      // eslint-disable-next-line no-console
      console.log(
        `🚀 ${process.env.NODE_ENV} mode: Bypassing authentication for invitation creation`
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

      if (
        role === USER_ROLES.SUPER_ADMIN &&
        user.role !== USER_ROLES.SUPER_ADMIN
      ) {
        return NextResponse.json(
          { error: 'Solo Super Admins pueden crear otros Super Admins' },
          { status: 403 }
        );
      }
    }

    console.log('🔍 Checking if user already exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
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

      console.log('✅ User exists but is not admin, allowing re-invitation');
    } else {
      console.log('✅ User does not exist, proceeding with invitation');
    }

    console.log('🔍 Checking for existing pending invitations:', email);

    // Clean up any expired or used invitations for this email first
    const cleanupResult = await prisma.adminInvitation.deleteMany({
      where: {
        email,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });

    if (cleanupResult.count > 0) {
      console.log(
        `🧹 Cleaned up ${cleanupResult.count} expired/used invitations for ${email}`
      );
    }

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
      console.log('❌ Pending invitation already exists:', email);
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      );
    }
    console.log('✅ No pending invitations found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log('🔑 Generated invitation token and expiry:', {
      tokenLength: token.length,
      expiresAt: expiresAt.toISOString(),
    });

    console.log('💾 Creating invitation in database');
    const invitation = await prisma.adminInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
      },
    });
    console.log('✅ Invitation created with ID:', invitation.id);

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXTAUTH_BACKOFFICE_URL ||
      process.env.NEXT_PUBLIC_BACKOFFICE_URL ||
      'https://backoffice.safetap.cl';

    console.log('🔧 Environment info for invitation URL:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log(
      '- NEXTAUTH_BACKOFFICE_URL:',
      process.env.NEXTAUTH_BACKOFFICE_URL
    );
    console.log(
      '- NEXT_PUBLIC_BACKOFFICE_URL:',
      process.env.NEXT_PUBLIC_BACKOFFICE_URL
    );
    console.log('- Final baseUrl:', baseUrl);

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
      }
    } else {
      console.warn(
        '⚠️ Email service not configured. Invitation created but email not sent.'
      );
      emailError = 'Email service not configured';
    }

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

    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      !emailSent
    ) {
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
