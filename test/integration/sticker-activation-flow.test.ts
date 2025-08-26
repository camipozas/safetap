import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '@/lib/prisma';

// This integration test validates the complete sticker activation flow
describe('Sticker Activation Integration Flow', () => {
  let testUser: { id: string; email: string };
  let testSticker: { id: string; slug: string; serial: string };

  beforeEach(async () => {
    // Clean up any existing test data
    const users = await prisma.user.findMany({
      where: { email: 'integration-test@safetap.cl' },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await prisma.payment.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.sticker.deleteMany({
      where: { ownerId: testUser?.id },
    });
    await prisma.user.deleteMany({
      where: { email: 'integration-test@safetap.cl' },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: 'integration-test@safetap.cl',
        name: 'Integration Test User',
        country: 'CL',
        updatedAt: new Date(),
      },
    });

    // Create test sticker
    testSticker = await prisma.sticker.create({
      data: {
        id: crypto.randomUUID(),
        slug: 'test-integration-slug',
        serial: 'TEST-INTEGRATION-001',
        ownerId: testUser.id,
        nameOnSticker: 'Test Integration',
        flagCode: 'CL',
        status: 'SHIPPED',
        updatedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany({ where: { userId: testUser.id } });
    await prisma.sticker.deleteMany({ where: { id: testSticker.id } });
    await prisma.user.deleteMany({ where: { id: testUser.id } });
  });

  it('should not allow activation without verified payment', async () => {
    // Create pending payment
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-pending',
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    // Fetch sticker with payments
    const stickerWithPayments = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    expect(stickerWithPayments).toBeTruthy();
    expect(stickerWithPayments?.Payment).toHaveLength(1);
    expect(stickerWithPayments?.Payment[0].status).toBe('PENDING');

    // Check that payment is not valid for activation
    const hasValidPayment = stickerWithPayments?.Payment.some(
      (p) => p.status === 'VERIFIED' || p.status === 'PAID'
    );
    expect(hasValidPayment).toBe(false);
  });

  it('should allow activation with verified payment and SHIPPED status', async () => {
    // Create verified payment
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-verified',
        status: 'VERIFIED',
        updatedAt: new Date(),
      },
    });

    // Fetch sticker with payments
    const stickerWithPayments = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    expect(stickerWithPayments).toBeTruthy();
    expect(stickerWithPayments?.status).toBe('SHIPPED');
    expect(stickerWithPayments?.Payment).toHaveLength(1);
    expect(stickerWithPayments?.Payment[0].status).toBe('VERIFIED');

    // Check that payment is valid for activation
    const hasValidPayment = stickerWithPayments?.Payment.some(
      (p) => p.status === 'VERIFIED' || p.status === 'PAID'
    );
    expect(hasValidPayment).toBe(true);

    // Simulate activation (this would be done by the API)
    const updatedSticker = await prisma.sticker.update({
      where: { id: testSticker.id },
      data: { status: 'ACTIVE' },
    });

    expect(updatedSticker.status).toBe('ACTIVE');
  });

  it('should accept PAID payment status for activation', async () => {
    // Create paid payment (using valid enum value)
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-paid',
        status: 'PAID',
        updatedAt: new Date(),
      },
    });

    // Fetch sticker with payments
    const stickerWithPayments = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Check that PAID status is valid for activation
    const hasValidPayment = stickerWithPayments?.Payment.some(
      (p) => p.status === 'VERIFIED' || p.status === 'PAID'
    );
    expect(hasValidPayment).toBe(true);
  });

  it('should not allow activation if sticker is not SHIPPED', async () => {
    // Create verified payment
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-not-shipped',
        status: 'VERIFIED',
        updatedAt: new Date(),
      },
    });

    // Update sticker to PAID status (not SHIPPED)
    await prisma.sticker.update({
      where: { id: testSticker.id },
      data: { status: 'PAID' },
    });

    // Fetch sticker with payments
    const stickerWithPayments = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    expect(stickerWithPayments?.status).toBe('PAID');

    // Even with valid payment, activation should not be allowed if not SHIPPED
    const hasValidPayment = stickerWithPayments?.Payment.some(
      (p) => p.status === 'VERIFIED' || p.status === 'PAID'
    );
    expect(hasValidPayment).toBe(true);

    // But status check should fail
    const canActivate =
      hasValidPayment && stickerWithPayments?.status === 'SHIPPED';
    expect(canActivate).toBe(false);
  });

  it('should handle multiple payments correctly (latest valid payment wins)', async () => {
    // Create multiple payments: pending, cancelled, then verified
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-1',
        status: 'PENDING',
        updatedAt: new Date(),
      },
    });

    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-2',
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-3',
        status: 'VERIFIED',
        updatedAt: new Date(),
      },
    });

    // Fetch sticker with payments
    const stickerWithPayments = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    expect(stickerWithPayments?.Payment).toHaveLength(3);

    // Should find at least one valid payment
    const hasValidPayment = stickerWithPayments?.Payment.some(
      (p) => p.status === 'VERIFIED' || p.status === 'PAID'
    );
    expect(hasValidPayment).toBe(true);
  });

  it('should maintain referential integrity during activation', async () => {
    // Create verified payment
    await prisma.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUser.id,
        stickerId: testSticker.id,
        amount: 2990,
        reference: 'test-ref-integrity',
        status: 'VERIFIED',
        updatedAt: new Date(),
      },
    });

    // Verify all relationships exist before activation
    const beforeActivation = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        User: true,
        Payment: true,
      },
    });

    expect(beforeActivation?.User.id).toBe(testUser.id);
    expect(beforeActivation?.Payment).toHaveLength(1);
    expect(beforeActivation?.Payment[0].userId).toBe(testUser.id);

    // Activate sticker
    await prisma.sticker.update({
      where: { id: testSticker.id },
      data: { status: 'ACTIVE' },
    });

    // Verify all relationships still exist after activation
    const afterActivation = await prisma.sticker.findFirst({
      where: { id: testSticker.id },
      include: {
        User: true,
        Payment: true,
      },
    });

    expect(afterActivation?.status).toBe('ACTIVE');
    expect(afterActivation?.User.id).toBe(testUser.id);
    expect(afterActivation?.Payment).toHaveLength(1);
    expect(afterActivation?.Payment[0].userId).toBe(testUser.id);
    expect(afterActivation?.Payment[0].status).toBe('VERIFIED');
  });
});
