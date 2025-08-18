import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
      ? 'CONFIGURADO'
      : 'NO CONFIGURADO',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? 'CONFIGURADO'
      : 'NO CONFIGURADO',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      ? 'CONFIGURADO'
      : 'NO CONFIGURADO',
    NODE_ENV: process.env.NODE_ENV,
  };

  const expectedCallbackUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    : 'NEXTAUTH_URL NO CONFIGURADO';

  return NextResponse.json({
    environment: envVars,
    expectedCallbackUrl,
    authorizedUrls: [
      'https://www.backoffice.safetap.cl/api/auth/callback/google',
      'https://backoffice.safetap.cl/api/auth/callback/google',
      'https://backoffice-camila-pozas-projects.vercel.app/api/auth/callback/google',
      'http://localhost:3001/api/auth/callback/google',
    ],
    matches: process.env.NEXTAUTH_URL
      ? expectedCallbackUrl ===
          'https://www.backoffice.safetap.cl/api/auth/callback/google' ||
        expectedCallbackUrl ===
          'https://backoffice.safetap.cl/api/auth/callback/google'
      : false,
  });
}
