import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/checkout/transfer/verify/route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sticker: {
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Zero Amount Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - Verify Zero Amount Transfer', () => {
    it('should automatically confirm zero-amount transactions as PAID', async () => {
      const mockZeroAmountPayment = {
        id: 'payment-zero',
        reference: 'SAFETAP-ZERO123',
        status: 'PENDING',
        amount: 0, // Zero amount transaction
        userId: 'user-zero',
        Sticker: {
          id: 'sticker-zero',
          status: 'ORDERED',
          ownerId: 'user-zero',
        },
        User: {
          id: 'user-zero',
          email: 'zero@example.com',
        },
      };

      const mockUpdatedPayment = {
        ...mockZeroAmountPayment,
        status: 'PAID',
        receivedAt: new Date(),
      };

      const mockUpdatedSticker = {
        ...mockZeroAmountPayment.Sticker,
        status: 'PAID',
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockZeroAmountPayment as never
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi.fn().mockResolvedValue(mockUpdatedPayment),
          },
          sticker: {
            update: vi.fn().mockResolvedValue(mockUpdatedSticker),
          },
          user: {
            update: vi
              .fn()
              .mockResolvedValue({ id: 'user-zero', totalSpent: 0 }),
          },
        };
        return callback(tx as never);
      });

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-ZERO123',
            transferConfirmed: false, // Even with false, should auto-confirm for zero amount
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.payment.status).toBe('PAID');
      expect(data.sticker.status).toBe('PAID');
      // For zero-amount transactions, the message should indicate successful confirmation
      expect(data.message).toBe(
        'Transferencia confirmada y sticker activado correctamente'
      );
    });

    it('should not update user totalSpent for zero-amount transactions', async () => {
      const mockZeroAmountPayment = {
        id: 'payment-zero',
        reference: 'SAFETAP-ZERO456',
        status: 'PENDING',
        amount: 0,
        userId: 'user-zero',
        Sticker: {
          id: 'sticker-zero',
          status: 'ORDERED',
          ownerId: 'user-zero',
        },
        User: {
          id: 'user-zero',
          email: 'zero@example.com',
        },
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockZeroAmountPayment as never
      );

      let userUpdateCalled = false;
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi.fn().mockResolvedValue({
              ...mockZeroAmountPayment,
              status: 'PAID',
              receivedAt: new Date(),
            }),
          },
          sticker: {
            update: vi.fn().mockResolvedValue({
              ...mockZeroAmountPayment.Sticker,
              status: 'PAID',
            }),
          },
          user: {
            update: vi.fn().mockImplementation(() => {
              userUpdateCalled = true;
              return Promise.resolve({ id: 'user-zero', totalSpent: 0 });
            }),
          },
        };
        return callback(tx as never);
      });

      await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-ZERO456',
            transferConfirmed: false,
          }),
        })
      );

      // User update should not be called for zero-amount transactions
      expect(userUpdateCalled).toBe(false);
    });

    it('should handle zero-amount transactions with transferConfirmed true', async () => {
      const mockZeroAmountPayment = {
        id: 'payment-zero',
        reference: 'SAFETAP-ZERO789',
        status: 'PENDING',
        amount: 0,
        userId: 'user-zero',
        Sticker: {
          id: 'sticker-zero',
          status: 'ORDERED',
          ownerId: 'user-zero',
        },
        User: {
          id: 'user-zero',
          email: 'zero@example.com',
        },
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        mockZeroAmountPayment as never
      );

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          payment: {
            update: vi.fn().mockResolvedValue({
              ...mockZeroAmountPayment,
              status: 'PAID',
              receivedAt: new Date(),
            }),
          },
          sticker: {
            update: vi.fn().mockResolvedValue({
              ...mockZeroAmountPayment.Sticker,
              status: 'PAID',
            }),
          },
          user: {
            update: vi
              .fn()
              .mockResolvedValue({ id: 'user-zero', totalSpent: 0 }),
          },
        };
        return callback(tx as never);
      });

      const response = await POST(
        new Request('http://localhost/api/checkout/transfer/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: 'SAFETAP-ZERO789',
            transferConfirmed: true, // Should work the same as false for zero amount
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.payment.status).toBe('PAID');
      expect(data.sticker.status).toBe('PAID');
    });
  });
});
