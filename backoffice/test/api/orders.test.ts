import { PUT } from '@/app/api/admin/orders/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sticker: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    payment: {
      updateMany: vi.fn(),
    },
  },
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('/api/admin/orders/[id] PUT', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set NODE_ENV to development for bypassing auth
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('updates order status successfully in development mode without session', async () => {
    const mockCurrentSticker = {
      id: 'test-id',
      groupId: null,
      status: 'ORDERED',
    };

    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'PAID',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
      mockCurrentSticker as never
    );
    vi.mocked(prisma.sticker.update).mockResolvedValue(
      mockUpdatedSticker as never
    );
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 });

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.devBypass).toBe(true);
    expect(responseData.sticker).toEqual(mockUpdatedSticker);

    expect(prisma.sticker.update).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: {
        status: 'PAID',
        updatedAt: expect.any(Date),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Verify that payments were also updated
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        Sticker: {
          id: 'test-id',
        },
      },
      data: {
        status: 'VERIFIED',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('synchronizes payment status when order status changes to PRINTING', async () => {
    const mockCurrentSticker = {
      id: 'test-id',
      groupId: null,
      status: 'ORDERED',
    };

    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'PRINTING',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
      mockCurrentSticker as never
    );
    vi.mocked(prisma.sticker.update).mockResolvedValue(
      mockUpdatedSticker as never
    );
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 2 });

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PRINTING' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);

    // Verify that payments were updated to PAID status
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        Sticker: {
          id: 'test-id',
        },
      },
      data: {
        status: 'PAID',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('synchronizes payment status when order status changes to REJECTED', async () => {
    const mockCurrentSticker = {
      id: 'test-id',
      groupId: null,
      status: 'ORDERED',
    };

    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'REJECTED',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
      mockCurrentSticker as never
    );
    vi.mocked(prisma.sticker.update).mockResolvedValue(
      mockUpdatedSticker as never
    );
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 });

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'REJECTED' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);

    // Verify that payments were updated to REJECTED status
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        Sticker: {
          id: 'test-id',
        },
      },
      data: {
        status: 'REJECTED',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('synchronizes payment status when order status changes to CANCELLED', async () => {
    const mockCurrentSticker = {
      id: 'test-id',
      groupId: null,
      status: 'ORDERED',
    };

    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'CANCELLED',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
      mockCurrentSticker as never
    );
    vi.mocked(prisma.sticker.update).mockResolvedValue(
      mockUpdatedSticker as never
    );
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 });

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);

    // Verify that payments were updated to CANCELLED status
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        Sticker: {
          id: 'test-id',
        },
      },
      data: {
        status: 'CANCELLED',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('does not update payments when order status has no corresponding payment status', async () => {
    const mockCurrentSticker = {
      id: 'test-id',
      groupId: null,
      status: 'ORDERED',
    };

    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'LOST',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
      mockCurrentSticker as never
    );
    vi.mocked(prisma.sticker.update).mockResolvedValue(
      mockUpdatedSticker as never
    );
    vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 0 });

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'LOST' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);

    // Verify that payments were updated to PAID status (LOST orders keep payments as PAID)
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        Sticker: {
          id: 'test-id',
        },
      },
      data: {
        status: 'PAID',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('rejects invalid status', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid state');
  });

  it('handles database errors', async () => {
    vi.mocked(prisma.sticker.findUnique).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Internal server error');
    expect(responseData.details).toBe('Database error');
  });

  it('handles record not found error', async () => {
    vi.mocked(prisma.sticker.findUnique).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3001/api/admin/orders/test-id',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const response = await PUT(request, {
      params: Promise.resolve({ id: 'test-id' }),
    });
    const responseData = await response.json();

    expect(response.status).toBe(404);
    expect(responseData.error).toBe('Order not found');
  });

  it('accepts all valid statuses', async () => {
    const validStatuses = [
      'ORDERED',
      'PAID',
      'PRINTING',
      'SHIPPED',
      'ACTIVE',
      'LOST',
    ];

    for (const status of validStatuses) {
      vi.clearAllMocks();

      const mockCurrentSticker = {
        id: 'test-id',
        groupId: null,
        status: 'ORDERED',
      };

      const mockUpdatedSticker = {
        id: 'test-id',
        status,
        owner: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(prisma.sticker.findUnique).mockResolvedValue(
        mockCurrentSticker as never
      );
      vi.mocked(prisma.sticker.update).mockResolvedValue(
        mockUpdatedSticker as never
      );

      const request = new NextRequest(
        'http://localhost:3001/api/admin/orders/test-id',
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'test-id' }),
      });
      expect(response.status).toBe(200);
    }
  });
});
