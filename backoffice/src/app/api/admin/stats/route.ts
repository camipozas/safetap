import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { USER_ROLES } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const [totalUsers, totalPayments, totalStickers, pendingPayments] =
      await Promise.all([
        prisma.user.count(),
        prisma.payment.count({ where: { status: 'VERIFIED' } }),
        prisma.sticker.count(),
        prisma.payment.count({ where: { status: 'PENDING' } }),
      ]);

    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'VERIFIED' },
      _sum: { amountCents: true },
    });

    return NextResponse.json({
      totalUsers,
      totalPayments,
      totalStickers,
      pendingPayments,
      totalRevenue: totalRevenue._sum.amountCents || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
