import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

// ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
export async function GET(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  
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
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+or+expired+session`);
    }

    console.log('Dev login successful for user:', session.user.email);
    
    // Crear respuesta que redirige a /account con parámetro especial
    const response = NextResponse.redirect(`${baseUrl}/account?dev-auth=${sessionToken}`);
    
    return response;

  } catch (error: any) {
    console.error('Dev login error:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=Login+failed`);
  }
}
