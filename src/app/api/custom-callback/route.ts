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

    // Verify the token (should match the hash in the DB)
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
          gte: new Date(), // Non expired tokens only
        },
      },
    });

    if (!verificationToken) {
      console.error('❌ Invalid or expired token for email:', email);
      // List existing tokens for debugging
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

    // Find or create user by email
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

    // Create or update session (simplified)
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Delete previous sessions for the user
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Create new session
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Limpiar token de verificación - COMENTADO debido a problemas con REPLICA IDENTITY
    // Clean up verification token - COMMENTED OUT due to issues with REPLICA IDENTITY
    // Instead of deleting/updating, we let them expire naturally
    // await prisma.verificationToken.updateMany({
    //   where: {
    //     identifier: email,
    //     token: hashedToken,
    //   },
    //   data: {
    //     expires: new Date(Date.now() - 1000), // Expirar inmediatamente
    //   },
    // Limpiar token de verificación después de uso para prevenir reutilización
    await prisma.verificationToken.updateMany({
      where: {
        identifier: email,
        token: hashedToken,
      },
      data: {
        expires: new Date(Date.now() - 1000), // Expirar inmediatamente
      },
    });

    console.log('✅ Login successful for:', email, 'Session token:', sessionToken.slice(0, 8) + '...');

    // Configure session cookie
    const response = NextResponse.redirect(new URL(callbackUrl, req.url));
    
    // Configure session cookie to be compatible with NextAuth
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
    });

    return response;

  } catch (error: unknown) {
    console.error('❌ Custom callback failed:', error);
    const errorParam = error instanceof Error ? error.message : 'CallbackError';
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, req.url));
  }
}
