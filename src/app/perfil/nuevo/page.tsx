import { redirect } from 'next/navigation';

import ProfileForm from '@/app/perfil/ui/ProfileForm';
import { auth } from '@/lib/auth';

export default async function NuevoPerfilPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const resolvedSearchParams = await searchParams;
  const stickerId = resolvedSearchParams?.stickerId;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Perfil de emergencia</h1>
      <ProfileForm stickerId={stickerId} />
    </div>
  );
}
