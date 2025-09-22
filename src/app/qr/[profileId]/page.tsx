import { notFound } from 'next/navigation';

import { EmergencyProfileDisplay } from '@/components/EmergencyProfileDisplay';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

interface QrProfilePageProps {
  params: Promise<{ profileId: string }>;
}

export default async function QrProfilePage({ params }: QrProfilePageProps) {
  const { profileId } = await params;

  // Find the profile by ID and check if it's public
  // Relaxed conditions to match /s/[slug] behavior
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      id: profileId,
      consentPublic: true,
      Sticker: {
        // Remove strict status and payment filters to be more permissive like /s/[slug]
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
      via: 'QR',
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
        insurance:
          typeof profile.insurance === 'object' &&
          profile.insurance !== null &&
          'type' in profile.insurance
            ? (profile.insurance as {
                type: 'fonasa' | 'isapre';
                isapre?: string;
                isapreCustom?: string;
                hasComplementary: boolean;
                complementaryInsurance?: string;
              })
            : undefined,
      }}
      showSafeTapId={false}
      isDemoMode={false}
    />
  );
}

export async function generateMetadata({ params }: QrProfilePageProps) {
  const { profileId } = await params;

  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      id: profileId,
      consentPublic: true,
      Sticker: {
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

  const profileUrl = `https://safetap.cl/qr/${profileId}`;
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
          url: 'https://safetap.cl/favicon.svg',
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
      images: ['https://safetap.cl/favicon.svg'],
    },
  };
}
