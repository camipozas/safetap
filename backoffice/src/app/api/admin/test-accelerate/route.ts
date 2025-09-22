import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Test Accelerate connection
 * @returns - The response object
 */
export async function GET() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const directPrisma = new PrismaClient({
      log: ['query', 'info', 'warn'],
    });

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

/**
 * PUT - Update Accelerate connection
 * @param request - The request object
 * @returns - The response object
 */
export async function PUT(_request: NextRequest) {
  try {
    const { name, country } = await _request.json();

    const { PrismaClient } = await import('@prisma/client');
    const directPrisma = new PrismaClient({
      log: ['query', 'info', 'warn'],
    });

    const result = await directPrisma.$transaction(async (tx) => {
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
