'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function WelcomeContent() {
  const searchParams = useSearchParams();
  const showCTA = searchParams.get('cta') === 'sticker';

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">¡Bienvenida/o!</h1>
      <p className="text-slate-700">
        Ya estás dentro. Si eres nuevo o invitado, te recomendamos partir con tu
        sticker.
      </p>

      {showCTA && (
        <div className="border rounded-lg p-4 bg-slate-50">
          <h2 className="text-lg font-medium">Consigue tu Sticker NFC</h2>
          <p className="text-sm text-slate-600">
            Configúralo en minutos y conéctalo a tu perfil.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/buy"
              className="inline-block bg-brand hover:bg-brand-600 text-white rounded-md px-4 py-2 transition-colors"
            >
              Comprar sticker
            </Link>
            <Link
              href="/guide"
              className="inline-block border border-slate-300 rounded-md px-4 py-2 hover:bg-slate-50 transition-colors"
            >
              Ver detalles
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto p-6 space-y-4">
          <h1 className="text-2xl font-semibold">¡Bienvenida/o!</h1>
          <p className="text-slate-700">
            Ya estás dentro. Si eres nuevo o invitado, te recomendamos partir
            con tu sticker.
          </p>
          <div className="animate-pulse">
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="h-6 bg-slate-200 rounded mb-2" />
              <div className="h-4 bg-slate-200 rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-10 bg-slate-200 rounded w-32" />
                <div className="h-10 bg-slate-200 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
