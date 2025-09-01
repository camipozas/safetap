import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }

  const payments = await prisma.payment.findMany({
    where: { status: 'PENDING' },
    include: { User: true, Sticker: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href={
              process.env.NEXTAUTH_BACKOFFICE_URL || 'http://localhost:3001'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Backoffice Completo
                </h3>
                <p className="text-sm text-gray-500">
                  Acceder al panel de administración completo
                </p>
              </div>
            </div>
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Pending payments</h2>
        <ul className="mt-2 grid gap-2">
          {payments.map((p: (typeof payments)[number]) => (
            <li
              key={p.id}
              className="rounded border bg-white p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  {p.User.email} — Ref {p.reference}
                </p>
                <p className="text-sm text-slate-600">
                  Sticker: {p.Sticker?.serial ?? '-'} · {p.amount} {p.currency}
                </p>
              </div>
              <form action={`/api/admin/payments/${p.id}/verify`} method="post">
                <button className="btn" type="submit">
                  Verify
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
