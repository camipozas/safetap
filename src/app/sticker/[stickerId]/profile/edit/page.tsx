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
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;

  const sticker = await prisma.sticker.findFirst({
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

  if (!sticker) {
    redirect('/account');
  }

  let profile = sticker.EmergencyProfile;

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
