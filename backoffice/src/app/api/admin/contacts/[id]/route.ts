import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, relation, phone, country, preferred } = await request.json();
    const contactId = params.id;

    if (!name || !relation || !phone) {
      return NextResponse.json(
        { error: 'Name, relation, and phone are required' },
        { status: 400 }
      );
    }

    const existingContact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Emergency contact not found' },
        { status: 404 }
      );
    }

    if (preferred) {
      await prisma.emergencyContact.updateMany({
        where: {
          profileId: existingContact.profileId,
          id: { not: contactId },
        },
        data: {
          preferred: false,
        },
      });
    }

    const updatedContact = await prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        name,
        relation,
        phone,
        country,
        preferred,
      },
    });

    return NextResponse.json({
      success: true,
      contact: updatedContact,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
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

    if (!session?.user || !hasPermission(session.user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.id;

    const existingContact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({
      success: true,
      message: 'Contacto eliminado correctamente',
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !hasPermission(session.user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.id;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id: contactId },
      include: {
        profile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
