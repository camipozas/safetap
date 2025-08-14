import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AccountPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      stickers: true,
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) redirect('/login');

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      {searchParams?.ref && (
        <div className="rounded-md border bg-white p-4">
          <p className="font-medium">Referencia de transferencia</p>
          <p className="text-sm text-slate-700">Usa este concepto al hacer la transferencia: <span className="font-mono">{searchParams.ref}</span></p>
          <p className="text-sm text-slate-700 mt-2">Datos bancarios: IBAN ES00 0000 0000 0000 0000 0000 · Beneficiario: Safetap</p>
        </div>
      )}
      <section>
        <h2 className="text-xl font-semibold">Mis stickers</h2>
        <ul className="mt-2 grid gap-2">
          {user.stickers.map((s) => (
            <li key={s.id} className="rounded border bg-white p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.nameOnSticker} — {s.flagCode}</p>
                <p className="text-sm text-slate-600">Estado: {s.status}</p>
                <p className="text-sm text-slate-600">URL pública: <span className="font-mono">/s/{s.slug}</span></p>
              </div>
              <div className="flex gap-2">
                <Link className="btn" href={`/s/${s.slug}`}>Ver perfil</Link>
                <Link className="underline underline-offset-4" href={`/profile/new?stickerId=${s.id}`}>Activar/Editar</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Pagos</h2>
        <ul className="mt-2 grid gap-2">
          {user.payments.map((p) => (
            <li key={p.id} className="rounded border bg-white p-3">
              <p>Ref: <span className="font-mono">{p.reference}</span> — Estado: {p.status} — {p.amountCents / 100} {p.currency}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
