/* eslint-disable no-console */
import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Mark this route as dynamic to prevent static rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    const callbackUrl = url.searchParams.get('callbackUrl') || '/account';

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/login?error=InvalidToken', req.url)
      );
    }

    // Verify the token (should match the hash in the DB)
    const hashedToken = crypto
      .createHash('sha256')
      .update(`${token}${process.env.NEXTAUTH_SECRET}`)
      .digest('hex');

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
        expires: {
          gte: new Date(), // Non-expired tokens only
        },
      },
    });

    if (!verificationToken) {
      // List existing tokens for debugging
      const existingTokens = await prisma.verificationToken.findMany({
        where: { identifier: email },
        select: { token: true, expires: true, identifier: true },
      });
      console.log(
        '🔍 Existing tokens for',
        email,
        ':',
        existingTokens.map((t) => ({
          token: `${t.token.slice(0, 16)}...`,
          expires: t.expires,
          expired: t.expires < new Date(),
        }))
      );
      return NextResponse.redirect(
        new URL('/login?error=InvalidToken', req.url)
      );
    }

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

    // Clean up verification token after use to prevent reuse.
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        token: hashedToken,
      },
    });

    // Configure session cookie
    const response = NextResponse.redirect(new URL(callbackUrl, req.url));

    // Get the correct cookie name for NextAuth
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    // Configure session cookie to be compatible with NextAuth
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const errorParam = error instanceof Error ? error.message : 'CallbackError';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, req.url)
    );
  }
}
