import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const started = Date.now();
  try {
    const rows = await (prisma as any).$queryRawUnsafe('SELECT 1 as ok');
    return NextResponse.json({ ok: true, rows, elapsedMs: Date.now() - started });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'Error' }, { status: 500 });
  }
}
