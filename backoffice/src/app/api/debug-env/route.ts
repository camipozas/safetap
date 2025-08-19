import { environment } from '@/environment/config';
import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXTAUTH_URL: environment.nextauth.url,
    NEXTAUTH_SECRET: environment.auth.secret ? 'CONFIGURADO' : 'NO CONFIGURADO',
    GOOGLE_CLIENT_ID: environment.auth.googleClientId
      ? 'CONFIGURADO'
      : 'NO CONFIGURADO',
    GOOGLE_CLIENT_SECRET: environment.auth.googleClientSecret
      ? 'CONFIGURADO'
      : 'NO CONFIGURADO',
    NODE_ENV: environment.app.environment,
  };

  const expectedCallbackUrl = environment.nextauth.url
    ? `${environment.nextauth.url}/api/auth/callback/google`
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
    matches: environment.nextauth.url
      ? expectedCallbackUrl ===
          'https://www.backoffice.safetap.cl/api/auth/callback/google' ||
        expectedCallbackUrl ===
          'https://backoffice.safetap.cl/api/auth/callback/google'
      : false,
  });
}
