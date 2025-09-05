import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import UserEditForm from './user-edit-form';

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Check if user has admin permissions
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Get the user data with their emergency profile (optimized approach)
  const userData = await prisma.user.findUnique({
    where: { id },
    include: {
      Sticker: {
        select: {
          id: true,
          nameOnSticker: true,
          flagCode: true,
          status: true,
        },
      },
      EmergencyProfile: {
        include: {
          EmergencyContact: {
            orderBy: {
              preferred: 'desc',
            },
          },
        },
        orderBy: {
          updatedByUserAt: 'desc',
        },
      },
    },
  });

  if (!userData) {
    redirect('/dashboard/orders');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Usuario: {userData.name || userData.email}
        </h1>
        <p className="text-gray-600 mt-2">
          Edita la información personal y de emergencia del usuario
        </p>
      </div>

      <UserEditForm user={userData} />
    </div>
  );
}
