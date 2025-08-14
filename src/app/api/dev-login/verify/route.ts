import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
export async function GET(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return NextResponse.redirect('/login');
  }

  try {
    const url = new URL(req.url);
    const sessionToken = url.searchParams.get('sessionToken');

    if (!sessionToken) {
      return NextResponse.redirect('/login?error=No session token');
    }

    // Verificar que la sesión existe y es válida
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.redirect('/login?error=Invalid or expired session');
    }

    // Configurar la cookie de sesión para NextAuth
    const response = NextResponse.redirect(`${process.env.PUBLIC_BASE_URL}/account`);
    
    // Usar el nombre de cookie que espera NextAuth
    const cookieName = isProduction
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: session.expires,
    });

    return response;

  } catch (error: any) {
    console.error('Dev login error:', error);
    return NextResponse.redirect('/login?error=Login failed');
  }
}
