import { notFound } from 'next/navigation';

import { EmergencyProfileDisplay } from '@/components/EmergencyProfileDisplay';
import { prisma } from '@/lib/prisma';

export default async function PublicProfile(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      consentPublic: true,
      sticker: {
        slug: params.slug,
        // Remove status filter to show all profiles regardless of payment status
      },
    },
    include: {
      contacts: { orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }] },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      sticker: {
        select: {
          slug: true,
          status: true,
          payments: {
            select: {
              id: true,
              status: true,
              amountCents: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Log the access
  await prisma.profileAccessLog.create({
    data: { profileId: profile.id, via: 'DIRECT' },
  });

  return (
    <EmergencyProfileDisplay
      profile={profile}
      showSafeTapId={false}
      isDemoMode={false}
    />
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      consentPublic: true,
      sticker: {
        slug: params.slug,
        // Remove filters to be consistent with main function
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      title: 'Perfil no encontrado - SafeTap',
      description: 'El perfil de emergencia solicitado no fue encontrado.',
    };
  }

  const userName =
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';

  return {
    title: `Perfil de Emergencia - ${userName} | SafeTap`,
    description: `Información de emergencia de ${userName} - SafeTap`,
    robots: 'noindex, nofollow', // Privacy protection
  };
}
