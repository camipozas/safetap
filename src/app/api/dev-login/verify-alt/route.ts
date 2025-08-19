import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

// Mark this route as dynamic to prevent static rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
export async function GET(req: Request) {
  const isProduction = environment.app.isProduction;
  const baseUrl = environment.app.url;

  if (isProduction) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  try {
    const url = new URL(req.url);
    const sessionToken = url.searchParams.get('sessionToken');

    if (!sessionToken) {
      return NextResponse.redirect(`${baseUrl}/login?error=No+session+token`);
    }

    // Verificar que la sesión existe y es válida
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=Invalid+or+expired+session`
      );
    }

    // Crear respuesta que redirige a /account con parámetro especial
    const response = NextResponse.redirect(
      `${baseUrl}/account?dev-auth=${sessionToken}`
    );

    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=Login+failed`);
  }
}
