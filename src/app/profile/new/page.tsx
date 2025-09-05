import { redirect } from 'next/navigation';

import ProfileForm from '@/app/profile/ui/ProfileForm';
import { auth } from '@/lib/auth';

export default async function NewProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Perfil de emergencia</h1>
      <ProfileForm showTemplates={true} />
    </div>
  );
}
