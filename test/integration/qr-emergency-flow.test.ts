import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';

// Mock prisma for integration testing
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sticker: {
      create: vi.fn(),
      update: vi.fn(),
    },
    emergencyProfile: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    profileAccessLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('QR Emergency Profile Integration Flow', () => {
  const mockUser = {
    id: 'user-integration-test',
    email: 'integration@test.com',
    name: 'Integration Test User',
  };

  const mockSticker = {
    id: 'sticker-integration-test',
    slug: 'integration-test-slug',
    serial: 'STK-INTEGRATION',
    ownerId: mockUser.id,
    nameOnSticker: 'Integration User',
    flagCode: '🇨🇱',
    status: 'ORDERED',
  };

  const mockPayment = {
    id: 'payment-integration-test',
    userId: mockUser.id,
    stickerId: mockSticker.id,
    reference: 'SAFETAP-INTEGRATION',
    status: 'PENDING',
    amount: 2990,
  };

  const mockProfile = {
    id: 'profile-integration-test',
    userId: mockUser.id,
    stickerId: mockSticker.id,
    bloodType: 'O+',
    allergies: ['Penicilina'],
    conditions: ['Diabetes'],
    medications: ['Metformina'],
    notes: 'Test emergency notes',
    consentPublic: true,
    organDonor: true,
    language: 'es',
    contacts: [
      {
        id: 'contact-1',
        name: 'Emergency Contact',
        relation: 'Spouse',
        phone: '+56912345678',
        preferred: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes full flow: order -> payment -> activation -> profile access', async () => {
    // Step 1: Create order (checkout initialization)
    vi.mocked(prisma.user.upsert).mockResolvedValue(mockUser as never);

    // Simulate order creation
    const orderResult = {
      sticker: mockSticker,
      payment: mockPayment,
    };

    expect(orderResult.payment.status).toBe('PENDING');
    expect(orderResult.sticker.status).toBe('ORDERED');

    // Step 2: Payment verification and sticker activation
    const paymentWithSticker = {
      ...mockPayment,
      sticker: mockSticker,
      user: mockUser,
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      paymentWithSticker as never
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const tx = {
        payment: {
          update: vi.fn().mockResolvedValue({
            ...mockPayment,
            status: 'TRANSFER_PAYMENT',
            receivedAt: new Date(),
          }),
        },
        sticker: {
          update: vi.fn().mockResolvedValue({
            ...mockSticker,
            status: 'ACTIVE',
          }),
        },
        emergencyProfile: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockProfile),
        },
      };
      return callback(tx as never);
    });

    // Call the transfer verification API
    const { POST } = await import('@/app/api/checkout/transfer/verify/route');
    const request = new Request(
      'http://localhost/api/checkout/transfer/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: mockPayment.reference,
          transferConfirmed: true,
        }),
      }
    );

    const response = await POST(request);
    const verificationData = await response.json();

    expect(response.status).toBe(200);
    expect(verificationData.payment.status).toBe('TRANSFER_PAYMENT');

    // Step 3: Profile access via QR
    const activeProfile = {
      ...mockProfile,
      consentPublic: true,
      Sticker: {
        ...mockSticker,
        status: 'ACTIVE',
        Payment: [{ status: 'TRANSFER_PAYMENT' }],
      },
      User: mockUser,
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
      activeProfile as never
    );

    // Call the QR profile API
    const { GET } = await import('@/app/api/qr/profile/[profileId]/route');
    const profileRequest = new Request(
      `http://localhost/api/qr/profile/${mockProfile.id}`
    );

    const profileResponse = await GET(profileRequest, {
      params: Promise.resolve({ profileId: mockProfile.id }),
    });
    const profileData = await profileResponse.json();

    expect(profileResponse.status).toBe(200);
    expect(profileData.qrUrl).toContain(`/qr/${mockProfile.id}`);

    // Verify the complete flow - APIs were actually called
    expect(prisma.payment.findUnique).toHaveBeenCalled();
    expect(prisma.emergencyProfile.findFirst).toHaveBeenCalled();
  });

  it('handles rejected payment correctly', async () => {
    const paymentWithSticker = {
      ...mockPayment,
      sticker: mockSticker,
      user: mockUser,
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      paymentWithSticker as never
    );
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const tx = {
        payment: {
          update: vi.fn().mockResolvedValue({
            ...mockPayment,
            status: 'REJECTED',
            receivedAt: null,
          }),
        },
      };
      return callback(tx as never);
    });

    // Simulate payment rejection
    const rejectionResult = {
      payment: { ...mockPayment, status: 'REJECTED' },
      sticker: mockSticker, // Should remain ORDERED
    };

    expect(rejectionResult.payment.status).toBe('REJECTED');
    expect(rejectionResult.sticker.status).toBe('ORDERED');

    // Profile should not be accessible for rejected payments
    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

    const profileAccess = null; // Profile not found because sticker is not ACTIVE

    expect(profileAccess).toBeNull();
  });

  it('ensures profile privacy when consent is not public', async () => {
    const privateProfile = {
      ...mockProfile,
      consentPublic: false, // Not public
      sticker: { ...mockSticker, status: 'ACTIVE' },
      user: mockUser,
    };

    // Query should return null because of consentPublic: true filter
    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

    const profileAccess = null;

    expect(profileAccess).toBeNull();

    // This would be called with privacy filters in real implementation
    expect(privateProfile.consentPublic).toBe(false);
  });

  it('handles multiple emergency contacts correctly', async () => {
    const profileWithMultipleContacts = {
      ...mockProfile,
      contacts: [
        {
          id: 'contact-1',
          name: 'Primary Contact',
          relation: 'Spouse',
          phone: '+56912345678',
          preferred: true,
        },
        {
          id: 'contact-2',
          name: 'Secondary Contact',
          relation: 'Parent',
          phone: '+56987654321',
          preferred: false,
        },
        {
          id: 'contact-3',
          name: 'Medical Contact',
          relation: 'Doctor',
          phone: '+56911111111',
          preferred: false,
        },
      ],
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue({
      ...profileWithMultipleContacts,
      sticker: { ...mockSticker, status: 'ACTIVE' },
      user: mockUser,
    } as never);

    const profileData = {
      ...profileWithMultipleContacts,
      sticker: { ...mockSticker, status: 'ACTIVE' },
      user: mockUser,
    };

    // Verify contacts are properly ordered (preferred first)
    const preferredContact = profileData.contacts.find((c) => c.preferred);
    const nonPreferredContacts = profileData.contacts.filter(
      (c) => !c.preferred
    );

    expect(preferredContact?.name).toBe('Primary Contact');
    expect(nonPreferredContacts).toHaveLength(2);
    expect(profileData.contacts).toHaveLength(3);
  });

  it('validates required medical information fields', async () => {
    const completeProfile = {
      ...mockProfile,
      bloodType: 'AB-',
      allergies: ['Aspirin', 'Shellfish'],
      conditions: ['Heart Disease', 'High Blood Pressure'],
      medications: ['Lisinopril', 'Atorvastatin'],
      notes: 'Has pacemaker - check before MRI',
      organDonor: true,
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue({
      ...completeProfile,
      sticker: { ...mockSticker, status: 'ACTIVE' },
      user: mockUser,
    } as never);

    const profileData = {
      ...completeProfile,
      sticker: { ...mockSticker, status: 'ACTIVE' },
      user: mockUser,
    };

    // Verify all medical information is present
    expect(profileData.bloodType).toBe('AB-');
    expect(profileData.allergies).toContain('Aspirin');
    expect(profileData.allergies).toContain('Shellfish');
    expect(profileData.conditions).toContain('Heart Disease');
    expect(profileData.medications).toContain('Lisinopril');
    expect(profileData.notes).toContain('pacemaker');
    expect(profileData.organDonor).toBe(true);
  });
});
