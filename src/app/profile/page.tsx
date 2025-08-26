/* eslint-disable import/order */
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Verificar si el usuario ya tiene un perfil de emergencia
  const emergencyProfile = await prisma.emergencyProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (emergencyProfile) {
    // Si ya tiene perfil, redirigir a la página de edición
    redirect(`/profile/${emergencyProfile.id}/edit`);
  } else {
    // Si no tiene perfil, redirigir a la página de creación
    redirect('/profile/new');
  }
}
