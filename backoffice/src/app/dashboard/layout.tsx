'use client';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import Sidebar, { MobileHeader } from '@/components/ui/sidebar';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';

interface ClientLayoutProps {
  children: React.ReactNode;
  isDevelopment?: boolean;
}

function ClientLayout({ children, isDevelopment = false }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <MobileHeader onToggle={toggleSidebar} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        {/* Main content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {isDevelopment && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    🚧 <strong>Modo Desarrollo</strong> - Sesión simulada para
                    testing
                  </p>
                </div>
              )}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === 'development') {
    return <ClientLayout isDevelopment={true}>{children}</ClientLayout>;
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !hasPermission(user.role, 'canAccessBackoffice')) {
    redirect('/auth/signin?error=access_denied');
  }

  return <ClientLayout>{children}</ClientLayout>;
}
