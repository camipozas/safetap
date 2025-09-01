'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav aria-label="Principal" className="hidden md:flex items-center gap-6">
      <Link
        href="/guide"
        className="text-slate-700 hover:text-brand font-medium transition-colors duration-200"
      >
        Guía de uso
      </Link>
      <Link
        href="/buy"
        className="text-slate-700 hover:text-brand font-medium transition-colors duration-200"
      >
        Comprar
      </Link>
      {session?.user ? (
        <Link
          href="/account"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand hover:text-white transition-all duration-200"
        >
          Mi cuenta
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand hover:text-white transition-all duration-200"
        >
          Iniciar sesión
        </Link>
      )}
    </nav>
  );
}
