import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import ProfileForm from '../../perfil/ui/ProfileForm';

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const stickerId = searchParams?.stickerId;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Perfil de emergencia</h1>
      <ProfileForm stickerId={stickerId} />
    </div>
  );
}
