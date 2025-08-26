import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/stickers/[stickerId]/activate/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sticker: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockStickerFindFirst = prisma.sticker.findFirst as ReturnType<
  typeof vi.fn
>;
const mockStickerUpdate = prisma.sticker.update as ReturnType<typeof vi.fn>;

describe('/api/stickers/[stickerId]/activate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('No autorizado');
  });

  it('returns 404 when sticker is not found', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Sticker no encontrado');
  });

  it('returns 400 when sticker has no valid payment', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue({
      id: 'test-id',
      status: 'SHIPPED',
      Payment: [{ status: 'PENDING' }, { status: 'CANCELLED' }],
    });

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe(
      'El sticker debe tener un pago verificado antes de poder activarse'
    );
  });

  it('returns 400 when sticker is not in SHIPPED status', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue({
      id: 'test-id',
      status: 'PAID',
      Payment: [{ status: 'VERIFIED' }],
    });

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe(
      'El sticker debe estar en estado "Enviado" para poder activarse'
    );
  });

  it('activates sticker successfully when all conditions are met', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue({
      id: 'test-id',
      status: 'SHIPPED',
      Payment: [{ status: 'PENDING' }, { status: 'VERIFIED' }],
    });
    mockStickerUpdate.mockResolvedValue({
      id: 'test-id',
      status: 'ACTIVE',
    });

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(mockStickerUpdate).toHaveBeenCalledWith({
      where: { id: 'test-id' },
      data: { status: 'ACTIVE' },
    });
  });

  it('accepts PAID payment status', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue({
      id: 'test-id',
      status: 'SHIPPED',
      Payment: [{ status: 'PAID' }],
    });
    mockStickerUpdate.mockResolvedValue({
      id: 'test-id',
      status: 'ACTIVE',
    });

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('includes payments in sticker query', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(mockStickerFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'test-id',
        User: { email: 'test@example.com' },
      },
      include: {
        Payment: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  });

  it('handles database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockStickerFindFirst.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost/api/stickers/test-id/activate'
    );
    const response = await POST(request, {
      params: Promise.resolve({ stickerId: 'test-id' }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Error interno del servidor');
  });
});
