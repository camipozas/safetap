import { Inter } from 'next/font/google';
import Link from 'next/link';
import { ReactNode } from 'react';

import MobileNav from '@/components/MobileNav';
import Navigation from '@/components/Navigation';
import SessionProviderWrapper from '@/components/providers/session-provider';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'SafeTap - Tu información vital, en un tap',
    template: '%s | SafeTap',
  },
  description:
    'Sistema de emergencia personal con códigos QR inteligentes. Acceso rápido a información médica vital y contactos de emergencia.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'SafeTap - Tu información vital, en un tap',
    description:
      'Sistema de emergencia personal con códigos QR inteligentes. Acceso rápido a información médica vital y contactos de emergencia en situaciones críticas.',
    url: 'https://safetap.cl',
    siteName: 'SafeTap',
    images: [
      {
        url: 'https://safetap.cl/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SafeTap - Sistema de emergencia personal con códigos QR inteligentes',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafeTap - Tu información vital, en un tap',
    description:
      'Sistema de emergencia personal con códigos QR inteligentes. Acceso rápido a información médica vital y contactos de emergencia en situaciones críticas.',
    images: ['https://safetap.cl/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    // Agrega aquí tus códigos de verificación cuando los tengas
    // google: 'google-verification-code',
    // yandex: 'yandex-verification-code',
  },
  alternates: {
    canonical: 'https://safetap.cl',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="w-full max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
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
                SafeTap
              </Link>

              {/* Desktop navigation */}
              <Navigation />

              {/* Mobile navigation */}
              <MobileNav />
            </div>
          </header>

          <main className="min-h-screen">
            <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
              {children}
            </div>
          </main>

          <footer className="bg-slate-900 text-white">
            <div className="w-full max-w-7xl mx-auto px-4 py-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                <div className="col-span-2 md:col-span-2">
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
                    <span className="font-bold text-xl">SafeTap</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Tu información vital siempre contigo. Tecnología que salva
                    vidas.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm md:text-base">
                    Producto
                  </h3>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <Link
                        href="/buy"
                        className="hover:text-white transition-colors text-sm"
                      >
                        Comprar sticker
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/guide"
                        className="hover:text-white transition-colors text-sm"
                      >
                        Guía de uso
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm md:text-base">
                    Cuenta
                  </h3>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <Link
                        href="/login"
                        className="hover:text-white transition-colors text-sm"
                      >
                        Iniciar sesión
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account"
                        className="hover:text-white transition-colors text-sm"
                      >
                        Mi cuenta
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <p className="text-slate-400 text-sm order-2 sm:order-1">
                  © {new Date().getFullYear()} SafeTap. Todos los derechos
                  reservados.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 mt-4 sm:mt-0 order-1 sm:order-2">
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
