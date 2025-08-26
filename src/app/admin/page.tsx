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
    include: { user: true, sticker: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
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
                  {p.user.email} — Ref {p.reference}
                </p>
                <p className="text-sm text-slate-600">
                  Sticker: {p.sticker?.serial ?? '-'} · {p.amount} {p.currency}
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
