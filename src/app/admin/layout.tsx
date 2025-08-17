import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !hasPermission(user.role, 'canAccessBackoffice')) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Panel de administración básico</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                💡 <strong>Nuevo:</strong> Usa el backoffice completo en{' '}
                <a
                  href="http://localhost:3001"
                  className="underline font-medium"
                >
                  localhost:3001
                </a>{' '}
                para funcionalidades avanzadas.
              </p>
            </div>
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
