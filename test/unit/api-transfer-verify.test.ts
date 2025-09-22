import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/checkout/transfer/verify/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sticker: {
      update: vi.fn(),
    },
    emergencyProfile: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('/api/checkout/transfer/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - Verify Transfer Payment', () => {
    it('successfully verifies transfer payment and activates sticker', async () => {
      console.log('🔍 Starting transfer payment verification');

      const mockPayment = {
        id: 'payment-123',
        reference: 'SAFETAP-ABC123',
        status: 'PENDING',
        userId: 'user-123',
        Sticker: {
          id: 'sticker-123',
          status: 'ORDERED',
          ownerId: 'user-123',
        },
        User: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'PAID',
        receivedAt: new Date(),
      };

      const mockSticker = {
        ...mockPayment.Sticker,
        status: 'ACTIVE',
      };

      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        stickerId: 'sticker-123',
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never
      );
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi.fn().mockResolvedValue(mockUpdatedPayment),
          },
          sticker: {
            update: vi.fn().mockResolvedValue(mockSticker),
          },
          user: {
            update: vi
              .fn()
              .mockResolvedValue({ id: 'user-123', totalSpent: 6990 }),
          },
          emergencyProfile: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockProfile),
          },
        };
        return callback(tx as never);
      });

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-ABC123',
            transferConfirmed: true,
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.payment.status).toBe('PAID');
      expect(data.sticker.status).toBe('ACTIVE');
    });

    it('rejects transfer payment when transferConfirmed is false', async () => {
      const mockPayment = {
        id: 'payment-456',
        reference: 'SAFETAP-XYZ456',
        status: 'PENDING',
        userId: 'user-456',
        Sticker: {
          id: 'sticker-456',
          status: 'ORDERED',
          ownerId: 'user-456',
        },
        User: {
          id: 'user-456',
          email: 'test456@example.com',
        },
      };

      const mockUpdatedPayment = {
        ...mockPayment,
        status: 'REJECTED',
        receivedAt: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never
      );
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi.fn().mockResolvedValue(mockUpdatedPayment),
          },
          sticker: {
            update: vi.fn(),
          },
          emergencyProfile: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
        };
        return callback(tx as never);
      });

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-XYZ456',
            transferConfirmed: false,
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.payment.status).toBe('REJECTED');
      expect(data.sticker.status).toBe('ORDERED');
    });

    it('returns 404 when payment not found', async () => {
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'NONEXISTENT-REF',
            transferConfirmed: true,
          }),
        })
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Pago no encontrado');
    });

    it('returns 400 when payment is not in PENDING status', async () => {
      const mockPayment = {
        id: 'payment-789',
        reference: 'SAFETAP-ALREADY789',
        status: 'PAID',
        userId: 'user-789',
        Sticker: null,
        User: {
          id: 'user-789',
          email: 'already@example.com',
        },
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never
      );

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-ALREADY789',
            transferConfirmed: true,
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('El pago ya fue procesado con estado: PAID');
    });

    it('returns 400 for invalid request data', async () => {
      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: undefined,
            transferConfirmed: true,
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Required');
    });

    it('handles existing emergency profile correctly', async () => {
      const mockPayment = {
        id: 'payment-existing',
        reference: 'SAFETAP-EXISTING',
        status: 'PENDING',
        userId: 'user-existing',
        Sticker: {
          id: 'sticker-existing',
          status: 'ORDERED',
          ownerId: 'user-existing',
        },
        User: {
          id: 'user-existing',
          email: 'existing@example.com',
        },
      };

      const mockExistingProfile = {
        id: 'existing-profile-id',
        userId: 'user-existing',
        stickerId: 'sticker-existing',
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never
      );
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi
              .fn()
              .mockResolvedValue({ ...mockPayment, status: 'PAID' }),
          },
          sticker: {
            update: vi
              .fn()
              .mockResolvedValue({ ...mockPayment.Sticker, status: 'ACTIVE' }),
          },
          user: {
            update: vi
              .fn()
              .mockResolvedValue({ id: 'existing-user', totalSpent: 6990 }),
          },
          emergencyProfile: {
            findFirst: vi.fn().mockResolvedValue(mockExistingProfile),
            create: vi.fn(), // Should not be called
          },
        };
        return callback(tx as never);
      });

      const request = new Request(
        'http://localhost/api/checkout/transfer/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-EXISTING',
            transferConfirmed: true,
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET - Check Payment Status', () => {
    it('returns payment status successfully', async () => {
      const mockPayment = {
        id: 'payment-status',
        reference: 'SAFETAP-STATUS123',
        status: 'PAID',
        receivedAt: new Date(),
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockPayment as never
      );

      const url = new URL(
        'http://localhost/api/checkout/transfer/verify?reference=SAFETAP-STATUS123'
      );
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.payment.status).toBe('PAID');
    });

    it('returns 400 when reference is missing', async () => {
      const url = new URL('http://localhost/api/checkout/transfer/verify');
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Referencia requerida');
    });

    it('returns 404 when payment not found', async () => {
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

      const url = new URL(
        'http://localhost/api/checkout/transfer/verify?reference=NONEXISTENT'
      );
      const request = new Request(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Pago no encontrado');
    });
  });
});
