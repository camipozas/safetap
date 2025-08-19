import { NextResponse } from 'next/server';

import { environment } from '@/environment/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/login', environment.nextauth.url));
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non authorized' }, { status: 403 });
  }

  await prisma.payment.update({
    where: { id: params.id },
    data: { status: 'VERIFIED', receivedAt: new Date() },
  });
  return NextResponse.redirect(new URL('/admin', environment.nextauth.url));
}
