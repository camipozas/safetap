import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create direct connection to Accelerate
    const { PrismaClient } = await import('@prisma/client');
    const directPrisma = new PrismaClient({
      log: ['query', 'info', 'warn'],
    });

    // Test direct read from Accelerate
    const camilaUser = await directPrisma.user.findUnique({
      where: { email: 'camila@safetap.cl' },
      select: {
        id: true,
        email: true,
        name: true,
        country: true,
        updatedAt: true,
        Sticker: {
          select: {
            id: true,
            nameOnSticker: true,
            flagCode: true,
            updatedAt: true,
          },
        },
      },
    });

    await directPrisma.$disconnect();

    if (!camilaUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          email: 'camila@safetap.cl',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Direct read from Accelerate successful',
      user: camilaUser,
      timestamp: new Date().toISOString(),
      source: 'direct-accelerate',
    });
  } catch (error) {
    console.error('❌ Error testing Accelerate connection:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, country } = await request.json();

    // Create direct connection to Accelerate
    const { PrismaClient } = await import('@prisma/client');
    const directPrisma = new PrismaClient({
      log: ['query', 'info', 'warn'],
    });

    // Direct update in Accelerate with transaction
    const result = await directPrisma.$transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { email: 'camila@safetap.cl' },
        data: {
          name: name || 'Camila Pozas',
          country: country || 'CL',
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          country: true,
          updatedAt: true,
        },
      });

      // Update associated stickers
      const stickerUpdate = await tx.sticker.updateMany({
        where: { ownerId: updatedUser.id },
        data: {
          nameOnSticker: name || 'Camila Pozas',
          flagCode: country || 'CL',
          updatedAt: new Date(),
        },
      });

      return {
        user: updatedUser,
        stickersUpdated: stickerUpdate.count,
      };
    });

    // Verify update with fresh read
    const verifyUser = await directPrisma.user.findUnique({
      where: { email: 'camila@safetap.cl' },
      select: {
        name: true,
        country: true,
        updatedAt: true,
      },
    });

    await directPrisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'User updated directly in Accelerate',
      result,
      verification: verifyUser,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error updating in Accelerate:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
