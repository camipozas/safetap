import type { EmergencyProfile, Sticker, User } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';

describe('Complete SafeTap Flow Integration Test', () => {
  let testUser: User;
  let testSticker: Sticker;
  let testProfile: EmergencyProfile;

  beforeEach(async () => {
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
    // Step 1: Create a new user order
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

    // Debug: log the response if request failed
    if (orderResponse.status !== 200) {
      const errorData = await orderResponse.json();
      console.log('Order API Error Status:', orderResponse.status);
      console.log('Order API Error:', errorData);
    }

    expect(orderResponse.status).toBe(200);
    const orderData = await orderResponse.json();
    expect(orderData.reference).toBeDefined();
    expect(orderData.paymentId).toBeDefined();

    // Get the created user and sticker
    testUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'test-flow@safetap.cl' },
    });

    testSticker = await prisma.sticker.findFirstOrThrow({
      where: { ownerId: testUser.id },
    });

    expect(testSticker).toBeDefined();
    expect(testSticker.status).toBe('ORDERED');

    // Step 2: Simulate transfer payment verification
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

    // Verify sticker status was updated
    const updatedSticker = await prisma.sticker.findUniqueOrThrow({
      where: { id: testSticker.id },
    });
    expect(updatedSticker.status).toBe('ACTIVE');

    // Verify that emergency profile was created
    const emergencyProfile = await prisma.emergencyProfile.findFirst({
      where: { stickerId: testSticker.id },
    });
    expect(emergencyProfile).toBeDefined();

    testProfile = emergencyProfile!;

    // Step 3: Create profile data
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

    // Step 4: Verify profile was updated correctly
    const finalProfile = await prisma.emergencyProfile.findUniqueOrThrow({
      where: { id: testProfile.id },
      include: { contacts: true },
    });

    expect(finalProfile.bloodType).toBe('O+');
    expect(finalProfile.consentPublic).toBe(true);
    expect(finalProfile.contacts).toHaveLength(1);
    expect(finalProfile.contacts[0].name).toBe('María Gonzalez');

    // Step 5: Test QR generation and public profile access
    const qrResponse = await fetch(
      `http://localhost:3000/api/qr/profile/${testProfile.id}`
    );
    expect(qrResponse.status).toBe(200);
    const qrData = await qrResponse.json();
    expect(qrData.qrUrl).toBeDefined();
    expect(qrData.qrUrl).toContain('/s/test-chile-flow');

    // Step 6: Test public profile access
    const publicProfileResponse = await fetch(
      `http://localhost:3000/s/${testSticker.slug}`
    );
    expect(publicProfileResponse.status).toBe(200);
    const publicProfileHtml = await publicProfileResponse.text();
    expect(publicProfileHtml).toContain('Test Chile');
    expect(publicProfileHtml).toContain('María Gonzalez');
  }, 15000);

  it('should generate consistent QR codes for the same profile', async () => {
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

    // Generate QR multiple times and verify consistency
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
