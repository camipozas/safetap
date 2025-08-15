import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AccountPage({ searchParams }: { searchParams?: Record<string, string> }) {
  let user = null;
  let session = await auth();
  
  // Manejo especial para dev-auth
  if (!session?.user?.email && searchParams?.['dev-auth'] && process.env.NODE_ENV === 'development') {
    const devSessionToken = searchParams['dev-auth'];
    try {
      const devSession = await prisma.session.findUnique({
        where: { sessionToken: devSessionToken },
        include: { user: true },
      });
      
      if (devSession && devSession.expires > new Date()) {
        user = await prisma.user.findUnique({
          where: { id: devSession.userId },
          include: {
            stickers: true,
            payments: { orderBy: { createdAt: 'desc' } },
          },
        });
      }
    } catch (error) {
      console.error('Dev auth error:', error);
    }
  }
  
  // Autenticación normal
  if (!user) {
    if (!session?.user?.email) redirect('/login');
    
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        stickers: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
  
  if (!user) redirect('/login');

  return (
    <div className="grid gap-6">
      {/* Banner de modo desarrollo */}
      {searchParams?.['dev-auth'] && process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800 font-medium">
              🔧 Modo desarrollo: Autenticado via dev-login ({user.email})
            </p>
          </div>
        </div>
      )}
      
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
              <div className="flex items-center gap-4">
                {/* Preview of sticker */}
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: (s as any).stickerColor || '#f1f5f9',
                    color: (s as any).textColor || '#000000'
                  }}
                >
                  ST
                </div>
                <div>
                  <p className="font-medium">{s.nameOnSticker} — {s.flagCode}</p>
                  <p className="text-sm text-slate-600">Estado: {s.status}</p>
                  <p className="text-sm text-slate-600">URL pública: <span className="font-mono">/s/{s.slug}</span></p>
                  {(s as any).stickerColor && (
                    <p className="text-xs text-slate-500">
                      Colores: <span className="font-mono">{(s as any).stickerColor}</span> / <span className="font-mono">{(s as any).textColor}</span>
                    </p>
                  )}
                </div>
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
