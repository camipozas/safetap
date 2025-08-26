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

  // Find the profile by ID and check if it's public and has active payment
  const profile = await prisma.emergencyProfile.findFirst({
    where: {
      id: profileId,
      consentPublic: true,
      sticker: {
        status: 'ACTIVE', // Only show profiles with active stickers
        payments: {
          some: {
            status: {
              in: ['TRANSFER_PAYMENT', 'VERIFIED', 'PAID', 'TRANSFERRED'], // Accept paid and transferred statuses
            },
          },
        },
      },
    },
    include: {
      contacts: {
        orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
      },
      user: {
        select: {
          name: true,
          email: true,
          country: true,
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
      profileId: profile.id,
      via: 'QR',
    },
  });

  return (
    <EmergencyProfileDisplay
      profile={profile}
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
      sticker: {
        status: 'ACTIVE',
        payments: {
          some: {
            status: {
              in: ['TRANSFER_PAYMENT', 'VERIFIED'],
            },
          },
        },
      },
    },
    include: {
      user: {
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
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';

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
