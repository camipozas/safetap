import './globals.css';

import SessionProviderWrapper from '@/components/providers/session-provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SafeTap Admin Dashboard',
  description: 'Panel de administración para SafeTap',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <style>{`
          body {
            background-color: white !important;
            color: black !important;
            font-family: system-ui, -apple-system, sans-serif;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
