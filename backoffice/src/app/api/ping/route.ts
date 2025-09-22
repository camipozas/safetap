import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

/**
 * GET - Ping
 * @returns - The response object
 */
export async function GET() {
  const started = Date.now();
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      database: Array.isArray(rows) && rows.length > 0 ? 'connected' : 'error',
      responseTime: `${Date.now() - started}ms`,
      version: process.env.npm_package_version || '0.1.0',
      environment: environment.app.environment,
    });
  } catch (error) {
    if (environment.app.isDevelopment) {
      console.error('Health check failed:', error);
    }
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - started}ms`,
      },
      { status: 500 }
    );
  }
}
