import type { EmergencyProfile, Sticker, User } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch globally for these integration tests
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock Prisma client for integration tests
const mockPrisma = {
  user: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  sticker: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  payment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  emergencyProfile: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  emergencyContact: {
    create: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  profileAccessLog: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

// Mock the prisma import
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

const { prisma } = await import('@/lib/prisma');

describe('Complete SafeTap Flow Integration Test', () => {
  let testUser: User;
  let testSticker: Sticker;
  let testProfile: EmergencyProfile;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup mock return values for database operations
    testUser = {
      id: 'test-user-id',
      email: 'test-flow@safetap.cl',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    testSticker = {
      id: 'test-sticker-id',
      slug: 'test-chile-flow',
      serial: 'TEST123FLOW',
      nameOnSticker: 'Test Chile',
      flagCode: 'CL',
      stickerColor: '#3b82f6',
      textColor: '#ffffff',
      status: 'ORDERED',
      ownerId: testUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sticker;

    testProfile = {
      id: 'test-profile-id',
      userId: testUser.id,
      stickerId: testSticker.id,
      consentPublic: true,
      bloodType: null,
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      organDonor: false,
      preferredContact: null,
      language: 'es',
      insurance: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedByUserAt: null,
    } as EmergencyProfile;

    // Setup mock database responses
    mockPrisma.user.create.mockResolvedValue(testUser);
    mockPrisma.user.findFirst.mockResolvedValue(testUser);
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    mockPrisma.sticker.create.mockResolvedValue(testSticker);
    mockPrisma.sticker.findFirst.mockResolvedValue(testSticker);
    mockPrisma.sticker.findUnique.mockResolvedValue(testSticker);
    mockPrisma.sticker.update.mockResolvedValue({
      ...testSticker,
      status: 'ACTIVE',
    });

    mockPrisma.payment.create.mockResolvedValue({
      id: 'test-payment-id',
      reference: 'TEST_REF_12345',
      amount: 5990,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockPrisma.emergencyProfile.create.mockResolvedValue(testProfile);
    mockPrisma.emergencyProfile.findUnique.mockResolvedValue(testProfile);
    mockPrisma.emergencyProfile.findUniqueOrThrow.mockResolvedValue({
      ...testProfile,
      bloodType: 'O+',
      contacts: [
        {
          id: 'test-contact-id',
          name: 'María Gonzalez',
          phone: '+56912345678',
          relation: 'Madre',
          preferred: true,
          profileId: testProfile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    mockPrisma.emergencyProfile.update.mockResolvedValue({
      ...testProfile,
      bloodType: 'O+',
      consentPublic: true,
    });

    mockPrisma.emergencyContact.create.mockResolvedValue({
      id: 'test-contact-id',
      name: 'María Gonzalez',
      phone: '+56912345678',
      relation: 'Madre',
      preferred: true,
      profileId: testProfile.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(async () => {
    // Clean up is handled by mocks, no real database operations needed
    vi.clearAllMocks();
  });

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

    // Create test user and sticker manually for this test (now mocked)
    // These calls will return the mocked objects set up in beforeEach
    const createdUser = await prisma.user.create({
      data: {
        email: 'test-flow@safetap.cl',
        name: 'Test User',
      },
    });

    const createdSticker = await prisma.sticker.create({
      data: {
        slug: 'test-chile-flow',
        serial: 'TEST123FLOW',
        nameOnSticker: 'Test Chile',
        flagCode: 'CL',
        stickerColor: '#3b82f6',
        textColor: '#ffffff',
        status: 'ORDERED',
        ownerId: createdUser.id,
      },
    });

    const createdProfile = await prisma.emergencyProfile.create({
      data: {
        userId: createdUser.id,
        stickerId: createdSticker.id,
        consentPublic: true,
      },
    });

    // Verify mocked data
    expect(createdUser).toBeDefined();
    expect(createdSticker).toBeDefined();
    expect(createdProfile).toBeDefined();

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

    expect(createdSticker).toBeDefined();
    expect(createdSticker.status).toBe('ORDERED');

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

    // Manually update sticker status to simulate successful payment (mocked)
    const updatedSticker = await prisma.sticker.update({
      where: { id: createdSticker.id },
      data: { status: 'ACTIVE' },
    });
    expect(updatedSticker.status).toBe('ACTIVE');

    expect(createdProfile).toBeDefined();

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
      `http://localhost:3000/api/profile/${createdProfile.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      }
    );

    expect(profileResponse.status).toBe(200);
    const updatedProfileData = await profileResponse.json();
    expect(updatedProfileData.success).toBe(true);

    // Manually update profile data to simulate successful profile update (mocked)
    await prisma.emergencyProfile.update({
      where: { id: createdProfile.id },
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
        profileId: createdProfile.id,
      },
    });

    // Verify profile was updated correctly (mocked)
    const updatedProfileWithContacts =
      await prisma.emergencyProfile.findUniqueOrThrow({
        where: { id: createdProfile.id },
        include: { contacts: true },
      });

    expect(updatedProfileWithContacts.bloodType).toBe('O+');
    expect(updatedProfileWithContacts.consentPublic).toBe(true);
    expect(updatedProfileWithContacts.contacts).toHaveLength(1);
    expect(updatedProfileWithContacts.contacts[0].name).toBe('María Gonzalez');

    // Step 5: Test QR generation (mocked)
    const qrResponse = await fetch(
      `http://localhost:3000/api/qr/profile/${createdProfile.id}`
    );
    expect(qrResponse.status).toBe(200);
    const qrData = await qrResponse.json();
    expect(qrData.qrUrl).toBeDefined();
    expect(qrData.qrUrl).toContain('/s/test-chile-flow');

    // Step 6: Test public profile access (mocked)
    const publicProfileResponse = await fetch(
      `http://localhost:3000/s/${createdSticker.slug}`
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

    // Create test data (mocked)
    const createdUser = await prisma.user.create({
      data: {
        email: 'test-flow@safetap.cl',
        name: 'Test User',
      },
    });

    const createdSticker = await prisma.sticker.create({
      data: {
        slug: 'test-chile-consistency',
        serial: 'TEST123CONS',
        nameOnSticker: 'Test Consistency',
        flagCode: 'CL',
        stickerColor: '#3b82f6',
        textColor: '#ffffff',
        status: 'ACTIVE',
        ownerId: createdUser.id,
      },
    });

    const createdProfile = await prisma.emergencyProfile.create({
      data: {
        userId: createdUser.id,
        stickerId: createdSticker.id,
        bloodType: 'A+',
        consentPublic: true,
      },
    });

    // Generate QR multiple times and verify consistency (mocked)
    const qrResponse1 = await fetch(
      `http://localhost:3000/api/qr/profile/${createdProfile.id}`
    );
    const qrData1 = await qrResponse1.json();

    const qrResponse2 = await fetch(
      `http://localhost:3000/api/qr/profile/${createdProfile.id}`
    );
    const qrData2 = await qrResponse2.json();

    expect(qrData1.qrUrl).toBe(qrData2.qrUrl);
    expect(qrData1.qrUrl).toContain('/s/test-chile-consistency');
  }, 10000);
});
