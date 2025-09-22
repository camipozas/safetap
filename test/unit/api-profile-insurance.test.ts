/* eslint-disable import/order */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/profile/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sticker: {
      findMany: vi.fn(),
    },
    emergencyProfile: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/validators', () => ({
  profileSchema: {
    parse: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { profileSchema } from '@/lib/validators';

describe('Profile API - Insurance with isapreCustom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save insurance data with isapreCustom field', async () => {
    // Mock authentication
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as never);

    // Mock user lookup
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
    } as never);

    // Mock profile data with isapreCustom
    const mockProfileData = {
      bloodType: 'A+' as const,
      allergies: [],
      conditions: [],
      medications: [],
      organDonor: false,
      insurance: {
        type: 'isapre' as const,
        isapre: 'Otro',
        isapreCustom: 'Isapre Regional del Norte',
        hasComplementary: true,
        complementaryInsurance: 'Vida Tres',
      },
      consentPublic: true,
      contacts: [
        {
          name: 'Test Contact',
          relation: 'Esposo/a',
          phone: '+56912345678',
          preferred: true,
        },
      ],
    };

    // Mock schema validation
    vi.mocked(profileSchema.parse).mockReturnValue(mockProfileData);

    // Mock stickers lookup for multi-sticker operation
    vi.mocked(prisma.sticker.findMany).mockResolvedValue([
      {
        id: 'sticker-123',
        ownerId: 'user-id',
        EmergencyProfile: null,
      },
    ] as never);

    // Mock profile creation
    vi.mocked(prisma.emergencyProfile.create).mockResolvedValue({
      id: 'profile-id',
      ...mockProfileData,
    } as never);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        values: mockProfileData,
        selectedStickerIds: ['sticker-123'], // Add required field
      }),
    });

    // Execute
    const response = await POST(request);
    const result = await response.json();

    // Verify
    expect(response.status).toBe(200);
    expect(result.message).toContain(
      'Perfiles actualizados/creados para 1 stickers'
    );

    // Verify prisma.emergencyProfile.create was called with correct data
    expect(prisma.emergencyProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          insurance: {
            type: 'isapre',
            isapre: 'Otro',
            isapreCustom: 'Isapre Regional del Norte',
            hasComplementary: true,
            complementaryInsurance: 'Vida Tres',
          },
        }),
      })
    );
  });

  it('should save insurance data with predefined isapre', async () => {
    // Mock authentication
    vi.mocked(auth).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as never);

    // Mock user lookup
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
    } as never);

    // Mock profile data with predefined isapre
    const mockProfileData = {
      bloodType: 'A+' as const,
      allergies: [],
      conditions: [],
      medications: [],
      organDonor: false,
      insurance: {
        type: 'isapre' as const,
        isapre: 'Cruz Blanca',
        hasComplementary: false,
      },
      consentPublic: true,
      contacts: [
        {
          name: 'Test Contact',
          relation: 'Esposo/a',
          phone: '+56912345678',
          preferred: true,
        },
      ],
    };

    // Mock schema validation
    vi.mocked(profileSchema.parse).mockReturnValue(mockProfileData);

    // Mock stickers lookup for multi-sticker operation
    vi.mocked(prisma.sticker.findMany).mockResolvedValue([
      {
        id: 'sticker-456',
        ownerId: 'user-id',
        EmergencyProfile: null,
      },
    ] as never);

    // Mock profile creation
    vi.mocked(prisma.emergencyProfile.create).mockResolvedValue({
      id: 'profile-id',
      ...mockProfileData,
    } as never);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/profile', {
      method: 'POST',
      body: JSON.stringify({
        values: mockProfileData,
        selectedStickerIds: ['sticker-456'], // Add required field
      }),
    });

    // Execute
    const response = await POST(request);
    const result = await response.json();

    // Verify
    expect(response.status).toBe(200);
    expect(result.message).toContain(
      'Perfiles actualizados/creados para 1 stickers'
    );

    // Verify prisma.emergencyProfile.create was called with correct data
    expect(prisma.emergencyProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          insurance: {
            type: 'isapre',
            isapre: 'Cruz Blanca',
            hasComplementary: false,
          },
        }),
      })
    );
  });
});
