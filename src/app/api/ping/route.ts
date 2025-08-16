import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const started = Date.now();
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    return NextResponse.json({ ok: true, rows, elapsedMs: Date.now() - started });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
