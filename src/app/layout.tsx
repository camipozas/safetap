import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'safetap',
  description: 'Tu información vital, en un tap.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <header className="border-b bg-white">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="font-semibold" aria-label="Inicio safetap">safetap</Link>
            <nav aria-label="Principal" className="flex gap-4">
              <Link href="/buy" className="hover:underline">Comprar</Link>
              <Link href="/login" className="hover:underline">Iniciar sesión</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t mt-12">
          <div className="container py-6 text-sm text-slate-600">© {new Date().getFullYear()} safetap</div>
        </footer>
      </body>
    </html>
  );
}
