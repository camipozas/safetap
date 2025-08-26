/* eslint-disable @typescript-eslint/no-explicit-any */
import { PUT } from '@/app/api/admin/orders/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sticker: {
      update: vi.fn(),
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
    const mockUpdatedSticker = {
      id: 'test-id',
      status: 'PAID',
      owner: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (prisma.sticker.update as any).mockResolvedValue(mockUpdatedSticker);

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
      data: { status: 'PAID' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    (prisma.sticker.update as any).mockRejectedValue(
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
    (prisma.sticker.update as any).mockRejectedValue(
      new Error('Record to update not found')
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

      const mockUpdatedSticker = {
        id: 'test-id',
        status,
        owner: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (prisma.sticker.update as any).mockResolvedValue(mockUpdatedSticker);

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
