import Link from 'next/link';
import { redirect } from 'next/navigation';

import ProfileForm from '@/app/profile/ui/ProfileForm';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export default async function EditStickerProfilePage({
  params,
}: {
  params: Promise<{ stickerId: string }>;
}) {
  console.log('🚨 EditStickerProfilePage: Starting page load...');

  const session = await auth();
  console.log('🔍 EditStickerProfilePage: Session check:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
  });

  if (!session?.user) {
    console.log('❌ EditStickerProfilePage: No session, redirecting to login');
    redirect('/login');
  }

  const resolvedParams = await params;
  console.log('🔍 EditStickerProfilePage: Looking for sticker:', {
    stickerId: resolvedParams.stickerId,
    userId: session.user.id,
  });

  // First try to find sticker by direct ownership
  let sticker = await prisma.sticker.findFirst({
    where: {
      id: resolvedParams.stickerId,
      ownerId: session.user.id,
    },
    include: {
      EmergencyProfile: {
        include: {
          User: true,
          EmergencyContact: true,
        },
      },
    },
  });

  // If not found by direct ownership, try to find by email (for duplicate accounts)
  if (!sticker && session.user.email) {
    console.log(
      '🔍 EditStickerProfilePage: Sticker not found by ownerId, trying by email...'
    );

    const usersWithSameEmail = await prisma.user.findMany({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (usersWithSameEmail.length > 0) {
      const userIds = usersWithSameEmail.map((user) => user.id);

      sticker = await prisma.sticker.findFirst({
        where: {
          id: resolvedParams.stickerId,
          ownerId: { in: userIds },
        },
        include: {
          EmergencyProfile: {
            include: {
              User: true,
              EmergencyContact: true,
            },
          },
        },
      });

      if (sticker) {
        console.log(
          '🔍 EditStickerProfilePage: Sticker found by email match:',
          {
            stickerId: sticker.id,
            stickerOwnerId: sticker.ownerId,
            sessionUserId: session.user.id,
          }
        );
      }
    }
  }

  console.log('🔍 EditStickerProfilePage: Sticker query result:', {
    found: !!sticker,
    stickerId: sticker?.id,
    ownerId: sticker?.ownerId,
    sessionUserId: session.user.id,
    hasEmergencyProfile: !!sticker?.EmergencyProfile,
  });

  if (!sticker) {
    console.log(
      '❌ EditStickerProfilePage: No sticker found, redirecting to account'
    );
    redirect('/account');
  }

  let profile = sticker.EmergencyProfile;

  if (!profile) {
    // Try to find any emergency profile for users with the same email
    if (session.user.email) {
      const usersWithSameEmail = await prisma.user.findMany({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (usersWithSameEmail.length > 0) {
        const userIds = usersWithSameEmail.map((u) => u.id);

        profile = await prisma.emergencyProfile.findFirst({
          where: {
            userId: { in: userIds },
          },
          include: {
            User: true,
            EmergencyContact: true,
          },
          orderBy: { updatedAt: 'desc' },
        });
      }
    }

    // Fallback to general profile for current user
    if (!profile) {
      const userGeneralProfile = await prisma.emergencyProfile.findFirst({
        where: {
          userId: session.user.id,
          stickerId: null,
        },
        include: {
          User: true,
          EmergencyContact: true,
        },
      });

      if (userGeneralProfile) {
        profile = userGeneralProfile;
      }
    }
  }

  console.log('🔍 EditStickerProfilePage: Final profile status:', {
    hasProfile: !!profile,
    profileId: profile?.id,
    profileUserId: profile?.userId,
    contactCount: profile?.EmergencyContact?.length || 0,
  });

  const transformedProfile = profile
    ? {
        id: profile.id,
        bloodType: profile.bloodType || undefined,
        allergies: profile.allergies,
        conditions: profile.conditions,
        medications: profile.medications,
        notes: profile.notes || undefined,
        language: profile.language || undefined,
        organDonor: profile.organDonor,
        insurance: profile.insurance as Record<string, unknown>,
        consentPublic: profile.consentPublic,
        contacts: profile.EmergencyContact.map((contact) => ({
          name: contact.name,
          relation: contact.relation,
          phone: contact.phone,
          country: contact.country || undefined,
          preferred: contact.preferred,
        })),
        user: { name: profile.User?.name || undefined },
      }
    : undefined;

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a mi cuenta
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">
        Editar perfil de {sticker.nameOnSticker}
      </h1>
      <ProfileForm
        profile={transformedProfile}
        stickerId={sticker.id}
        stickerInfo={{
          id: sticker.id,
          nameOnSticker: sticker.nameOnSticker,
          flagCode: sticker.flagCode,
        }}
        showTemplates={true}
      />
    </div>
  );
}
