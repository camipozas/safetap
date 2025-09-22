import type { JsonValue } from '@prisma/client/runtime/library';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface EmergencyProfile {
  id: string;
  bloodType: string | null;
  allergies: string[] | string | null;
  conditions: string[] | string | null;
  medications: string[] | string | null;
  organDonor: boolean | null;
  insurance: JsonValue;
}

/**
 * Create a medical fingerprint for a profile
 * @param profile - The profile to create a fingerprint for
 * @returns - The fingerprint
 */
function createMedicalFingerprint(profile: EmergencyProfile | null): string {
  if (!profile) {
    return 'no-profile';
  }

  const items = [
    profile.bloodType || '',
    Array.isArray(profile.allergies)
      ? profile.allergies.sort().join(',')
      : profile.allergies || '',
    Array.isArray(profile.conditions)
      ? profile.conditions.sort().join(',')
      : profile.conditions || '',
    Array.isArray(profile.medications)
      ? profile.medications.sort().join(',')
      : profile.medications || '',
    profile.organDonor ? 'donor' : 'no-donor',
    profile.insurance ? 'has-insurance' : 'no-insurance',
  ];

  return items.join('|');
}

interface ProcessedSticker {
  id: string;
  name: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
  createdAt: string;
  hasProfile: boolean;
  medicalFingerprint: string;
  profileSummary: {
    bloodType: string | null;
    hasAllergies: boolean;
    hasConditions: boolean;
    hasMedications: boolean;
    hasInsurance: boolean;
    organDonor: boolean | null;
  } | null;
}

interface StickerGroup {
  key: string;
  name: string;
  count: number;
  stickers: ProcessedSticker[];
  hasAnyProfile: boolean;
  allHaveProfile: boolean;
  sampleProfile: ProcessedSticker['profileSummary'];
  groupSummary: {
    bloodType: string | null;
    hasAllergies: boolean;
    hasConditions: boolean;
    hasMedications: boolean;
    hasInsurance: boolean;
    organDonor: boolean | null;
  } | null;
}

/**
 * Get stickers for the user grouped by similar medical profile
 * @param request - The request body
 * @returns - The response body
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const excludeStickerId = searchParams.get('exclude');
    const filterSimilar = searchParams.get('filter') === 'similar';

    const userStickers = await prisma.sticker.findMany({
      where: {
        ownerId: session.user.id,
        ...(excludeStickerId && { id: { not: excludeStickerId } }),
      },
      include: {
        EmergencyProfile: {
          select: {
            id: true,
            bloodType: true,
            allergies: true,
            conditions: true,
            medications: true,
            organDonor: true,
            insurance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If there is a sticker to exclude, get its profile for comparison
    let referenceFingerprint: string | null = null;
    if (excludeStickerId && filterSimilar) {
      const referenceSticker = await prisma.sticker.findFirst({
        where: {
          id: excludeStickerId,
          ownerId: session.user.id,
        },
        include: {
          EmergencyProfile: true,
        },
      });

      if (referenceSticker) {
        referenceFingerprint = createMedicalFingerprint(
          referenceSticker.EmergencyProfile
        );
      }
    }

    // Group stickers by name and similar medical profile
    const processedStickers: ProcessedSticker[] = userStickers.map(
      (sticker) => {
        const fingerprint = createMedicalFingerprint(sticker.EmergencyProfile);

        return {
          id: sticker.id,
          name: sticker.nameOnSticker,
          flagCode: sticker.flagCode,
          colorPresetId: sticker.colorPresetId,
          stickerColor: sticker.stickerColor,
          textColor: sticker.textColor,
          createdAt: sticker.createdAt.toISOString(),
          hasProfile: !!sticker.EmergencyProfile,
          medicalFingerprint: fingerprint,
          profileSummary: sticker.EmergencyProfile
            ? {
                bloodType: sticker.EmergencyProfile.bloodType,
                hasAllergies: Array.isArray(sticker.EmergencyProfile.allergies)
                  ? sticker.EmergencyProfile.allergies.length > 0
                  : !!sticker.EmergencyProfile.allergies,
                hasConditions: Array.isArray(
                  sticker.EmergencyProfile.conditions
                )
                  ? sticker.EmergencyProfile.conditions.length > 0
                  : !!sticker.EmergencyProfile.conditions,
                hasMedications: Array.isArray(
                  sticker.EmergencyProfile.medications
                )
                  ? sticker.EmergencyProfile.medications.length > 0
                  : !!sticker.EmergencyProfile.medications,
                hasInsurance: !!sticker.EmergencyProfile.insurance,
                organDonor: sticker.EmergencyProfile.organDonor,
              }
            : null,
        };
      }
    );

    // Filter by similarity if required
    const filteredStickers = referenceFingerprint
      ? processedStickers.filter(
          (sticker) => sticker.medicalFingerprint === referenceFingerprint
        )
      : processedStickers;

    // Group by name and medical profile
    const groupedStickers = filteredStickers.reduce(
      (groups, sticker) => {
        const key = `${sticker.name}|${sticker.medicalFingerprint}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(sticker);
        return groups;
      },
      {} as Record<string, ProcessedSticker[]>
    );

    // Convert to array and add group information
    const stickerGroups: StickerGroup[] = Object.entries(groupedStickers).map(
      ([key, stickers]) => {
        const [name] = key.split('|');
        const firstSticker = stickers[0];

        return {
          key,
          name,
          count: stickers.length,
          stickers,
          hasAnyProfile: stickers.some((s) => s.hasProfile),
          allHaveProfile: stickers.every((s) => s.hasProfile),
          sampleProfile: firstSticker.profileSummary,
          groupSummary: firstSticker.hasProfile
            ? {
                bloodType: firstSticker.profileSummary?.bloodType || null,
                hasAllergies:
                  firstSticker.profileSummary?.hasAllergies || false,
                hasConditions:
                  firstSticker.profileSummary?.hasConditions || false,
                hasMedications:
                  firstSticker.profileSummary?.hasMedications || false,
                hasInsurance:
                  firstSticker.profileSummary?.hasInsurance || false,
                organDonor: firstSticker.profileSummary?.organDonor || null,
              }
            : null,
        };
      }
    );

    // Sort groups: first the ones with a profile, then by name
    stickerGroups.sort((a, b) => {
      if (a.hasAnyProfile && !b.hasAnyProfile) {
        return -1;
      }
      if (!a.hasAnyProfile && b.hasAnyProfile) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      groups: stickerGroups,
      totalStickers: userStickers.length,
      filteredCount: filteredStickers.length,
      isFiltered: !!referenceFingerprint,
    });
  } catch (error) {
    console.error('Error fetching grouped stickers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
