import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';

import MobileNav from '@/components/MobileNav';
import SessionProviderWrapper from '@/components/providers/session-provider';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'safetap',
  description: 'Tu información vital, en un tap.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="container flex h-16 items-center justify-between">
              <Link
                href="/"
                className="font-bold text-lg sm:text-xl text-brand flex items-center"
                aria-label="Inicio safetap"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand rounded-lg flex items-center justify-center mr-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                safetap
              </Link>

              {/* Desktop navigation */}
              <nav
                aria-label="Principal"
                className="hidden md:flex items-center gap-6"
              >
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
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand hover:text-white transition-all duration-200"
                >
                  Iniciar sesión
                </Link>
              </nav>

              {/* Mobile navigation */}
              <MobileNav />
            </div>
          </header>

          <main className="min-h-screen">
            <div className="container py-8 md:py-12">{children}</div>
          </main>

          <footer className="bg-slate-900 text-white">
            <div className="container py-12">
              <div className="grid md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center mr-2">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="font-bold text-xl">safetap</span>
                  </div>
                  <p className="text-slate-400 max-w-md">
                    Tu información vital siempre contigo. Tecnología que salva
                    vidas.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Producto</h3>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <Link
                        href="/buy"
                        className="hover:text-white transition-colors"
                      >
                        Comprar sticker
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/guide"
                        className="hover:text-white transition-colors"
                      >
                        Guía de uso
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Cuenta</h3>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <Link
                        href="/login"
                        className="hover:text-white transition-colors"
                      >
                        Iniciar sesión
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account"
                        className="hover:text-white transition-colors"
                      >
                        Mi cuenta
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-400 text-sm">
                  © {new Date().getFullYear()} safetap. Todos los derechos
                  reservados.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <Link
                    href="/privacy"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Privacidad
                  </Link>
                  <Link
                    href="/terms"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
