import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // In development, redirect to dev-login; in production, to sign-in
    if (process.env.NODE_ENV === 'development') {
      redirect('/dev-login');
    } else {
      redirect('/auth/signin');
    }
  }

  redirect('/dashboard');
}
