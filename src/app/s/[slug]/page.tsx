import { notFound } from 'next/navigation';

import { EmergencyProfileDisplay } from '@/components/EmergencyProfileDisplay';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

export default async function PublicProfile(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  // First, find the sticker by slug to get its owner
  const sticker = await prisma.sticker.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true, status: true },
  });

  if (!sticker) {
    notFound();
  }

  // Then find the emergency profile for that user
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      consentPublic: true,
      userId: sticker.ownerId, // Find profile by sticker owner
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
        insurance:
          profile.insurance && typeof profile.insurance === 'object'
            ? (profile.insurance as {
                type: 'fonasa' | 'isapre';
                isapre?: string;
                isapreCustom?: string;
                hasComplementary: boolean;
                complementaryInsurance?: string;
              })
            : undefined,
        contacts: profile.EmergencyContact,
        user: profile.User,
        sticker: {
          slug: params.slug,
          status: sticker.status,
          payments: [], // No need for payment info in profile display
        },
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
