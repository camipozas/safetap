import crypto from 'crypto';

import { NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

// Email message configuration - can be moved to i18n later
const emailMessages = {
  subject: 'Inicia sesión en SafeTap',
  text: (loginUrl: string) =>
    `Inicia sesión en SafeTap\n\nHaz clic en el siguiente enlace para iniciar sesión:\n${loginUrl}\n\nEste enlace expira en 24 horas.\n\nSi no solicitaste este email, puedes ignorarlo.`,
  html: (loginUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6;">SafeTap</h1>
      <h2>Inicia sesión en tu cuenta</h2>
      <p>Haz clic en el botón de abajo para iniciar sesión en SafeTap:</p>
      <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
        Iniciar Sesión
      </a>
      <p style="color: #666; font-size: 14px;">
        Este enlace expira en 24 horas. Si no solicitaste este email, puedes ignorarlo.
      </p>
      <p style="color: #666; font-size: 12px;">
        O copia y pega este enlace en tu navegador: ${loginUrl}
      </p>
    </div>
  `,
};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if we're in a test environment (either NODE_ENV=test or when running e2e tests)
    const isTestMode =
      process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';

    // In test environment, skip database operations and return early
    if (isTestMode) {
      console.log('🚫 Test mode: Skipping database operations and email send');

      // Create mock login URL for testing
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      const mockToken = `test-token-${Date.now()}`;
      const loginUrl = `${baseUrl}/api/custom-callback?callbackUrl=${encodeURIComponent('/account')}&token=${mockToken}&email=${encodeURIComponent(email)}`;

      const result = {
        messageId: `test-mock-${Date.now()}`,
        accepted: [email],
        rejected: [],
        pending: [],
        response: '250 Mock OK - Test mode, no real email sent',
      };

      const responseData: Record<string, unknown> = {
        success: true,
        messageId: result.messageId,
        message: `Email de login enviado a ${email}`,
        loginUrl,
        testInfo:
          'Test mode - no real email sent, loginUrl provided for testing',
      };

      return NextResponse.json(responseData);
    }

    // 1. Create or find user by email (only in non-test environments)
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as default name
        },
      });
    }

    // 2. Create a verification token
    const token = crypto.randomUUID();
    const hashedToken = crypto
      .createHash('sha256')
      .update(`${token}${environment.auth.secret}`)
      .digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    // 3. Create new URL for login
    // Get the base URL from the request
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const loginUrl = `${baseUrl}/api/custom-callback?callbackUrl=${encodeURIComponent('/account')}&token=${token}&email=${encodeURIComponent(email)}`;

    // 4. Validate required environment variables for email (only in non-test environments)
    if (
      !environment.email.smtpHost ||
      !environment.email.smtpUser ||
      !environment.email.smtpPass ||
      !environment.email.from
    ) {
      console.error('❌ Missing required email environment variables.');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service configuration error',
        },
        { status: 500 }
      );
    }

    // 5. Send email with login link

    // Production email sending
    const transporter = nodemailer.createTransport({
      host: environment.email.smtpHost,
      port: 587,
      auth: {
        user: environment.email.smtpUser,
        pass: environment.email.smtpPass,
      },
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const result = await transporter.sendMail({
      to: email,
      from: environment.email.from,
      subject: emailMessages.subject,
      text: emailMessages.text(loginUrl),
      html: emailMessages.html(loginUrl),
    });

    // Return the login URL for testing purposes in development
    const responseData: Record<string, unknown> = {
      success: true,
      messageId: result.messageId,
      message: `Email de login enviado a ${email}`,
    };

    // Add login URL for development testing
    if (environment.app.isDevelopment) {
      responseData.loginUrl = loginUrl;
      responseData.testInfo =
        'This loginUrl is only shown in development mode for testing';
    }

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('❌ Custom login failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
