import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import DiscountManagement from './ui/DiscountManagement';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export default async function DiscountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || !hasPermission(user.role, 'canAccessBackoffice')) {
    redirect('/');
  }

  const discounts = await prisma.discountCode.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { email: true, name: true },
      },
      _count: {
        select: { redemptions: true },
      },
    },
  });

  const total = await prisma.discountCode.count();

  const serializedDiscounts = discounts.map((discount) => ({
    ...discount,
    amount: Number(discount.amount),
    createdAt: discount.createdAt.toISOString(),
    expiresAt: discount.expiresAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Códigos de Descuento
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona códigos de descuento para aplicar en el checkout
        </p>
      </div>

      <DiscountManagement
        initialDiscounts={serializedDiscounts}
        initialTotal={total}
      />
    </div>
  );
}
