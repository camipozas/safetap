import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import Sidebar from '@/components/ui/sidebar';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                🚧 <strong>Modo Desarrollo</strong> - Sesión simulada para
                testing
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    );
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
