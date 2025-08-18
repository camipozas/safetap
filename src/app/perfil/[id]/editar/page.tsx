import { redirect } from 'next/navigation';

import ProfileForm from '@/app/perfil/ui/ProfileForm';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function EditarPerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const profile = await prisma.emergencyProfile.findFirst({
    where: { id: params.id, user: { email: session.user.email! } },
    include: { contacts: true },
  });
  if (!profile) {
    redirect('/account');
  }
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Editar perfil</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
