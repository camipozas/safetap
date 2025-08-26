import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import ClientLayout from '@/components/dashboard/ClientLayout';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';

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
