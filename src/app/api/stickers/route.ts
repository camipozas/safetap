import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { Sticker: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({ stickers: user.Sticker });
}
