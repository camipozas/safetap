import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PromotionManagement from './ui/PromotionManagement';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Promociones por Cantidad | SafeTap Backoffice',
  description:
    'Gestiona promociones automáticas basadas en cantidad de productos',
};

export default async function PromotionsPage() {
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

  const promotions = await prisma.promotion.findMany({
    take: 20,
    orderBy: [
      { priority: 'desc' },
      { minQuantity: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const total = await prisma.promotion.count();

  const serializedPromotions = promotions.map((promotion) => ({
    ...promotion,
    discountValue: Number(promotion.discountValue),
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
    startDate: promotion.startDate?.toISOString() || null,
    endDate: promotion.endDate?.toISOString() || null,
  }));

  return (
    <div className="py-10">
      <header className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 flex items-center">
              <svg
                className="h-8 w-8 text-blue-600 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Promociones por Cantidad
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Sistema automático de descuentos basado en la cantidad de
              productos en el carrito. Los descuentos se aplican automáticamente
              durante el checkout cuando se alcanza la cantidad mínima
              requerida.
            </p>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PromotionManagement
            initialPromotions={serializedPromotions}
            initialTotal={total}
          />
        </div>
      </main>
    </div>
  );
}
