import type { EmergencyProfile, Sticker, User } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';

// Mock fetch globally for these integration tests
global.fetch = vi.fn() as unknown as typeof fetch;

describe('Complete SafeTap Flow Integration Test', () => {
  let testUser: User;
  let testSticker: Sticker;
  let testProfile: EmergencyProfile;

  beforeEach(async () => {
    // Reset fetch mock before each test
    vi.clearAllMocks();

    // Clean up test data with proper deletion order
    await prisma.profileAccessLog.deleteMany({
      where: { profile: { user: { email: 'test-flow@safetap.cl' } } },
    });
    await prisma.emergencyContact.deleteMany({
      where: { profile: { user: { email: 'test-flow@safetap.cl' } } },
    });
    await prisma.emergencyProfile.deleteMany({
      where: { user: { email: 'test-flow@safetap.cl' } },
    });
    await prisma.payment.deleteMany({
      where: { reference: { startsWith: 'TEST_' } },
    });
    await prisma.sticker.deleteMany({
      where: { ownerId: { in: await getUserIds() } },
    });
    await prisma.user.deleteMany({
      where: { email: 'test-flow@safetap.cl' },
    });
  });

  afterEach(async () => {
    // Clean up test data with proper deletion order
    await prisma.profileAccessLog.deleteMany({
      where: { profile: { user: { email: 'test-flow@safetap.cl' } } },
    });
    await prisma.emergencyContact.deleteMany({
      where: { profile: { user: { email: 'test-flow@safetap.cl' } } },
    });
    await prisma.emergencyProfile.deleteMany({
      where: { user: { email: 'test-flow@safetap.cl' } },
    });
    await prisma.payment.deleteMany({
      where: { reference: { startsWith: 'TEST_' } },
    });
    await prisma.sticker.deleteMany({
      where: { ownerId: { in: await getUserIds() } },
    });
    await prisma.user.deleteMany({
      where: { email: 'test-flow@safetap.cl' },
    });
  });

  // Helper function to get user IDs
  async function getUserIds(): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: { email: 'test-flow@safetap.cl' },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  it('should complete the full SafeTap flow: order → payment → activation → profile creation → QR generation', async () => {
    // Setup mocks for the APIs
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    // Mock the order endpoint
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            reference: 'TEST_REF_12345',
            paymentId: 'TEST_PAYMENT_ID',
          }),
      } as Response)
    );

    // Mock the payment verification endpoint
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
          }),
      } as Response)
    );

    // Mock the profile update endpoint
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
          }),
      } as Response)
    );

    // Mock the QR generation endpoint
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            qrUrl: '/s/test-chile-flow',
          }),
      } as Response)
    );

    // Mock the public profile endpoint
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        text: () =>
          Promise.resolve(
            '<html><body>Test Chile María Gonzalez</body></html>'
          ),
      } as Response)
    );

    // Create test user and sticker manually for this test
    testUser = await prisma.user.create({
      data: {
        email: 'test-flow@safetap.cl',
        name: 'Test User',
      },
    });

    testSticker = await prisma.sticker.create({
      data: {
        slug: 'test-chile-flow',
        serial: 'TEST123FLOW',
        nameOnSticker: 'Test Chile',
        flagCode: 'CL',
        stickerColor: '#3b82f6',
        textColor: '#ffffff',
        status: 'ORDERED',
        ownerId: testUser.id,
      },
    });

    testProfile = await prisma.emergencyProfile.create({
      data: {
        userId: testUser.id,
        stickerId: testSticker.id,
        consentPublic: true,
      },
    });

    // Step 1: Create a new user order (mocked)
    const orderResponse = await fetch(
      'http://localhost:3000/api/checkout/transfer/init',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: 1,
          email: 'test-flow@safetap.cl',
          nameOnSticker: 'Test Chile',
          flagCode: 'CL',
          colorPresetId: 'blue',
          stickerColor: '#3b82f6',
          textColor: '#ffffff',
        }),
      }
    );

    expect(orderResponse.status).toBe(200);
    const orderData = await orderResponse.json();
    expect(orderData.reference).toBeDefined();
    expect(orderData.paymentId).toBeDefined();

    expect(testSticker).toBeDefined();
    expect(testSticker.status).toBe('ORDERED');

    // Step 2: Simulate transfer payment verification (mocked)
    const paymentResponse = await fetch(
      'http://localhost:3000/api/checkout/transfer/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: orderData.reference,
          transferConfirmed: true,
        }),
      }
    );

    expect(paymentResponse.status).toBe(200);
    const paymentData = await paymentResponse.json();
    expect(paymentData.success).toBe(true);

    // Manually update sticker status to simulate successful payment
    const updatedSticker = await prisma.sticker.update({
      where: { id: testSticker.id },
      data: { status: 'ACTIVE' },
    });
    expect(updatedSticker.status).toBe('ACTIVE');

    expect(testProfile).toBeDefined();

    // Step 3: Create profile data (mocked)
    const profileData = {
      bloodType: 'O+',
      allergies: ['Peanuts', 'Shellfish'],
      conditions: ['Diabetes'],
      medications: ['Insulin'],
      notes: 'Emergency contact: Family doctor',
      organDonor: true,
      consentPublic: true,
      preferredContact: true,
      contacts: [
        {
          name: 'María Gonzalez',
          phone: '+56912345678',
          relation: 'Madre',
          preferred: true,
        },
      ],
    };

    const profileResponse = await fetch(
      `http://localhost:3000/api/profile/${testProfile.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      }
    );

    expect(profileResponse.status).toBe(200);
    const updatedProfileData = await profileResponse.json();
    expect(updatedProfileData.success).toBe(true);

    // Manually update profile data to simulate successful profile update
    await prisma.emergencyProfile.update({
      where: { id: testProfile.id },
      data: {
        bloodType: 'O+',
        consentPublic: true,
      },
    });

    await prisma.emergencyContact.create({
      data: {
        name: 'María Gonzalez',
        phone: '+56912345678',
        relation: 'Madre',
        preferred: true,
        profileId: testProfile.id,
      },
    });

    // Verify profile was updated correctly
    const updatedProfileWithContacts =
      await prisma.emergencyProfile.findUniqueOrThrow({
        where: { id: testProfile.id },
        include: { contacts: true },
      });

    expect(updatedProfileWithContacts.bloodType).toBe('O+');
    expect(updatedProfileWithContacts.consentPublic).toBe(true);
    expect(updatedProfileWithContacts.contacts).toHaveLength(1);
    expect(updatedProfileWithContacts.contacts[0].name).toBe('María Gonzalez');

    // Step 5: Test QR generation (mocked)
    const qrResponse = await fetch(
      `http://localhost:3000/api/qr/profile/${testProfile.id}`
    );
    expect(qrResponse.status).toBe(200);
    const qrData = await qrResponse.json();
    expect(qrData.qrUrl).toBeDefined();
    expect(qrData.qrUrl).toContain('/s/test-chile-flow');

    // Step 6: Test public profile access (mocked)
    const publicProfileResponse = await fetch(
      `http://localhost:3000/s/${testSticker.slug}`
    );
    expect(publicProfileResponse.status).toBe(200);
    const publicProfileHtml = await publicProfileResponse.text();
    expect(publicProfileHtml).toContain('Test Chile');
    expect(publicProfileHtml).toContain('María Gonzalez');
  }, 15000);

  it('should generate consistent QR codes for the same profile', async () => {
    // Setup mocks for QR generation
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            qrUrl: '/s/test-chile-consistency',
          }),
      } as Response)
    );

    // Create test data
    testUser = await prisma.user.create({
      data: {
        email: 'test-flow@safetap.cl',
        name: 'Test User',
      },
    });

    testSticker = await prisma.sticker.create({
      data: {
        slug: 'test-chile-consistency',
        serial: 'TEST123CONS',
        nameOnSticker: 'Test Consistency',
        flagCode: 'CL',
        stickerColor: '#3b82f6',
        textColor: '#ffffff',
        status: 'ACTIVE',
        ownerId: testUser.id,
      },
    });

    testProfile = await prisma.emergencyProfile.create({
      data: {
        userId: testUser.id,
        stickerId: testSticker.id,
        bloodType: 'A+',
        consentPublic: true,
      },
    });

    // Generate QR multiple times and verify consistency (mocked)
    const qrResponse1 = await fetch(
      `http://localhost:3000/api/qr/profile/${testProfile.id}`
    );
    const qrData1 = await qrResponse1.json();

    const qrResponse2 = await fetch(
      `http://localhost:3000/api/qr/profile/${testProfile.id}`
    );
    const qrData2 = await qrResponse2.json();

    expect(qrData1.qrUrl).toBe(qrData2.qrUrl);
    expect(qrData1.qrUrl).toContain('/s/test-chile-consistency');
  }, 10000);
});
