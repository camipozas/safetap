/* eslint-disable no-console */
import { prisma } from '@/lib/prisma';

/**
 * Gets or creates an emergency profile for a user.
 * If the user already has a profile, reuses it instead of creating duplicates.
 * This prevents creating multiple identical emergency profiles when buying multiple stickers.
 */
export async function getOrCreateUserEmergencyProfile(
  userId: string,
  stickerId?: string
) {
  // First, try to find an existing profile for this user
  const existingProfile = await prisma.emergencyProfile.findFirst({
    where: { userId },
    include: {
      EmergencyContact: true,
    },
    orderBy: { updatedByUserAt: 'desc' }, // Get the most recently updated by user
  });

  if (existingProfile) {
    console.log('🔄 Reusing existing emergency profile:', existingProfile.id);

    // If we have a stickerId and this profile isn't linked to any sticker yet,
    // we can link it
    if (stickerId && !existingProfile.stickerId) {
      const updated = await prisma.emergencyProfile.update({
        where: { id: existingProfile.id },
        data: {
          stickerId,
          updatedAt: new Date(),
        },
        include: {
          EmergencyContact: true,
        },
      });
      return updated;
    }

    return existingProfile;
  }

  console.log('🆕 Creating new emergency profile for user:', userId);

  // Create a new profile with minimal default data
  const newProfile = await prisma.emergencyProfile.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      stickerId,
      // Default values - user will fill these in later
      allergies: [],
      conditions: [],
      medications: [],
      language: 'es',
      organDonor: false,
      consentPublic: true,
      updatedAt: new Date(),
      // Create a default emergency contact placeholder
      EmergencyContact: {
        create: {
          id: crypto.randomUUID(),
          name: '',
          relation: '',
          phone: '',
          preferred: true,
          updatedAt: new Date(),
        },
      },
    },
    include: {
      EmergencyContact: true,
    },
  });

  return newProfile;
}

/**
 * Gets the emergency profile data for a sticker, handling cases where
 * multiple stickers might reference the same profile.
 */
export async function getEmergencyProfileForSticker(stickerId: string) {
  const sticker = await prisma.sticker.findUnique({
    where: { id: stickerId },
    include: {
      EmergencyProfile: {
        include: {
          EmergencyContact: true,
        },
      },
      User: true,
    },
  });

  if (!sticker) {
    return null;
  }

  // If this sticker has a direct profile, use it
  if (sticker.EmergencyProfile) {
    return sticker.EmergencyProfile;
  }

  // Otherwise, try to find the user's most recent profile
  const userProfile = await prisma.emergencyProfile.findFirst({
    where: { userId: sticker.ownerId },
    include: {
      EmergencyContact: true,
    },
    orderBy: { updatedByUserAt: 'desc' },
  });

  return userProfile;
}

/**
 * Checks if a user should reuse their existing emergency profile
 * instead of creating a new one for additional stickers.
 */
export async function shouldReuseEmergencyProfile(
  userId: string
): Promise<boolean> {
  const existingProfiles = await prisma.emergencyProfile.count({
    where: {
      userId,
      // Only count profiles that have meaningful data
      OR: [
        { bloodType: { not: null } },
        { allergies: { isEmpty: false } },
        { conditions: { isEmpty: false } },
        { medications: { isEmpty: false } },
        { notes: { not: null } },
        { EmergencyContact: { some: { name: { not: '' } } } },
      ],
    },
  });

  return existingProfiles > 0;
}

/**
 * Gets the emergency profile URL for a sticker by finding the profile ID
 * and constructing the correct QR URL for emergency information.
 */
export async function getEmergencyProfileUrlForSticker(
  stickerId: string,
  baseUrl: string
): Promise<string | null> {
  const emergencyProfile = await getEmergencyProfileForSticker(stickerId);

  if (!emergencyProfile) {
    return null;
  }

  return `${baseUrl}/qr/${emergencyProfile.id}`;
}
