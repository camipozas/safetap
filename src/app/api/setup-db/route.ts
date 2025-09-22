import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

/**
 * Setup database - only for development
 * @returns - The response body
 */
export async function POST() {
  if (environment.app.isProduction) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const userCount = await prisma.user.count();

    return NextResponse.json({
      message: '✅ Database configured correctly',
      note: 'The tables have already been created using `prisma db push`',
      status: {
        connected: true,
        userCount,
      },
      instructions: [
        '1. Go to /dev-login to test the development login',
        '2. Use the system normally',
        '3. The tables have already been created and are working',
      ],
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: errorMessage,
        note: 'Error connecting to the database',
      },
      { status: 500 }
    );
  }
}
