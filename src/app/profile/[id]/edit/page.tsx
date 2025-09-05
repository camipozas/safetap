import { redirect } from 'next/navigation';

import ProfileForm from '@/app/profile/ui/ProfileForm';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for auth-protected page
export const dynamic = 'force-dynamic';

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const resolvedParams = await params;
  const profile = await prisma.emergencyProfile.findFirst({
    where: { id: resolvedParams.id, User: { email: session.user.email! } },
    include: {
      User: true,
      EmergencyContact: true,
    },
  });
  if (!profile) {
    redirect('/account');
  }

  // Transform Prisma data to ProfileForm expected type
  const transformedProfile = {
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
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Editar perfil</h1>
      <ProfileForm profile={transformedProfile} showTemplates={true} />
    </div>
  );
}
