import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE - Revoke invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invitationId = resolvedParams.id;

    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      // eslint-disable-next-line no-console
      console.log(
        `🚀 ${process.env.NODE_ENV} mode: Bypassing authentication for invitation deletion`
      );
    } else {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || !hasPermission(user.role, 'canManageAdmins')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const invitation = await prisma.adminInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    await prisma.adminInvitation.delete({
      where: { id: invitationId },
    });

    `🗑️ Invitación revocada para ${invitation.email}`;

    return NextResponse.json({
      success: true,
      message: `Invitación para ${invitation.email} revocada exitosamente`,
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
