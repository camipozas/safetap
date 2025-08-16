import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    const callbackUrl = url.searchParams.get('callbackUrl') || '/account';

    console.log('🔄 [CUSTOM CALLBACK] Processing login with:', { token: token?.slice(0, 8) + '...', email, callbackUrl });

    if (!token || !email) {
      console.error('❌ Missing token or email');
      return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url));
    }

    // Verificar el token (debe coincidir con el hash en la DB)
    const hashedToken = crypto
      .createHash('sha256')
      .update(`${token}${process.env.NEXTAUTH_SECRET}`)
      .digest('hex');

    console.log('🔍 Looking for verification token with hash:', hashedToken.slice(0, 16) + '...');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        expires: {
          gte: new Date(), // Token no expirado
        },
      },
    });

    if (!verificationToken) {
      console.error('❌ Invalid or expired token for email:', email);
      // Listar tokens existentes para debug
      const existingTokens = await prisma.verificationToken.findMany({
        where: { identifier: email },
        select: { token: true, expires: true, identifier: true }
      });
      console.log('🔍 Existing tokens for', email, ':', existingTokens.map(t => ({
        token: t.token.slice(0, 16) + '...', 
        expires: t.expires,
        expired: t.expires < new Date()
      })));
      return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url));
    }

    console.log('✅ Token verified successfully');

    // Encontrar o crear usuario
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('👤 Creating new user:', email);
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      });
    } else {
      console.log('👤 Found existing user:', email);
    }

    // Crear o actualizar sesión (simplificada)
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    // Eliminar sesiones anteriores del usuario
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Crear nueva sesión
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Limpiar token de verificación - COMENTADO debido a problemas con REPLICA IDENTITY
    // En lugar de eliminar/actualizar, dejamos que expiren naturalmente
    // await prisma.verificationToken.updateMany({
    //   where: {
    //     identifier: email,
    //     token: hashedToken,
    //   },
    //   data: {
    //     expires: new Date(Date.now() - 1000), // Expirar inmediatamente
    //   },
    // });

    console.log('✅ Login successful for:', email, 'Session token:', sessionToken.slice(0, 8) + '...');

    // Configurar cookie de sesión
    const response = NextResponse.redirect(new URL(callbackUrl, req.url));
    
    // Configurar cookie compatible con NextAuth
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
    });

    return response;

  } catch (error: any) {
    console.error('❌ Custom callback failed:', error);
    return NextResponse.redirect(new URL('/login?error=CallbackError', req.url));
  }
}
