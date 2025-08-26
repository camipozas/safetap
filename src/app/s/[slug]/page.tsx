import { notFound } from 'next/navigation';

import { EmergencyProfileDisplay } from '@/components/EmergencyProfileDisplay';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

export default async function PublicProfile(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      consentPublic: true,
      Sticker: {
        slug: params.slug,
        // Remove status filter to show all profiles regardless of payment status
      },
    },
    include: {
      EmergencyContact: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      User: {
        select: {
          name: true,
          email: true,
          country: true,
        },
      },
      Sticker: {
        select: {
          slug: true,
          status: true,
          Payment: {
            select: {
              id: true,
              status: true,
              amount: true,
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
    data: {
      id: crypto.randomUUID(),
      profileId: profile.id,
      via: 'DIRECT',
    },
  });

  return (
    <EmergencyProfileDisplay
      profile={{
        ...profile,
        contacts: profile.EmergencyContact,
        user: profile.User,
        sticker: profile.Sticker
          ? {
              ...profile.Sticker,
              payments: profile.Sticker.Payment,
            }
          : null,
      }}
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
      Sticker: {
        slug: params.slug,
        // Remove filters to be consistent with main function
      },
    },
    include: {
      User: {
        select: {
          name: true,
          email: true,
          country: true,
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
    profile.User.name ?? profile.User.email?.split('@')[0] ?? 'Usuario';

  const profileUrl = `https://safetap.cl/s/${params.slug}`;
  const profileDescription = `Información de emergencia de ${userName}. Acceso rápido a datos médicos vitales y contactos de emergencia a través de SafeTap.`;

  return {
    title: `${userName} - Perfil de Emergencia | SafeTap`,
    description: profileDescription,
    robots: 'noindex, nofollow', // Privacy protection
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${userName} - Perfil de Emergencia`,
      description: profileDescription,
      url: profileUrl,
      siteName: 'SafeTap',
      type: 'profile',
      images: [
        {
          url: 'https://safetap.cl/og-image.png',
          width: 1200,
          height: 630,
          alt: `Perfil de emergencia de ${userName} - SafeTap`,
        },
      ],
      locale: 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${userName} - Perfil de Emergencia`,
      description: profileDescription,
      images: ['https://safetap.cl/twitter-image.png'],
    },
  };
}
