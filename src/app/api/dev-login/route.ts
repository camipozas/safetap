import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

// ⚠️ JUST FOR DEVELOPMENT PURPOSES ⚠️
export async function POST(req: Request) {
  if (environment.app.isProduction) {
    return NextResponse.json(
      { error: 'No disponible en producción' },
      { status: 403 }
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Create or find user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use the part before @ as name
        },
      });
    }

    // Create session for the user
    const sessionToken = `dev-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Generate login URL
    const baseUrl = environment.app.url;
    const loginUrl = `${baseUrl}/api/dev-login/verify-alt?sessionToken=${sessionToken}`;

    return NextResponse.json({
      message: 'Usuario y sesión creados',
      user: { id: user.id, email: user.email, name: user.name },
      loginUrl,
      instructions:
        'Haz click en el loginUrl para autenticarte automáticamente',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
