import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // If user has admin permissions, redirect to backoffice
  if (user && hasPermission(user.role, 'canAccessBackoffice')) {
    const backofficeUrl =
      process.env.NEXTAUTH_BACKOFFICE_URL || 'http://localhost:3001';
    redirect(`${backofficeUrl}/dashboard`);
  }

  // For regular users, redirect to account page
  redirect('/account');
}
