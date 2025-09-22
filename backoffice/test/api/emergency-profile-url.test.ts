import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/admin/emergency-profile-url/[orderId]/route';

// Mock the dependencies
vi.mock('@/lib/emergency-profile-service', () => ({
  getEmergencyProfileUrlForSticker: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sticker: {
      findFirst: vi.fn(),
    },
  },
}));

import { getEmergencyProfileUrlForSticker } from '@/lib/emergency-profile-service';
import { prisma } from '@/lib/prisma';

describe('/api/admin/emergency-profile-url/[orderId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variable
    process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';
  });

  it('returns emergency profile URL when sticker and profile exist', async () => {
    const mockSticker = {
      id: 'sticker-123',
      slug: 'test-slug',
      status: 'ACTIVE' as const,
    } as never;

    const mockEmergencyUrl = 'https://safetap.cl/qr/emergency-profile-456';

    vi.mocked(prisma.sticker.findFirst).mockResolvedValue(mockSticker);
    vi.mocked(getEmergencyProfileUrlForSticker).mockResolvedValue(
      mockEmergencyUrl
    );

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/sticker-123'
    );
    const params = Promise.resolve({ orderId: 'sticker-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      orderId: 'sticker-123',
      stickerId: 'sticker-123',
      emergencyUrl: mockEmergencyUrl,
      stickerInfo: {
        id: 'sticker-123',
        slug: 'test-slug',
        status: 'ACTIVE',
      },
    });

    expect(prisma.sticker.findFirst).toHaveBeenCalledWith({
      where: { id: 'sticker-123' },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    expect(getEmergencyProfileUrlForSticker).toHaveBeenCalledWith(
      'sticker-123',
      'https://safetap.cl'
    );
  });

  it('returns 404 when sticker not found', async () => {
    vi.mocked(prisma.sticker.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/nonexistent'
    );
    const params = Promise.resolve({ orderId: 'nonexistent' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Sticker no encontrado',
    });
  });

  it('returns 404 when emergency profile not found', async () => {
    const mockSticker = {
      id: 'sticker-123',
      slug: 'test-slug',
      status: 'ACTIVE' as const,
    } as never;

    vi.mocked(prisma.sticker.findFirst).mockResolvedValue(mockSticker);
    vi.mocked(getEmergencyProfileUrlForSticker).mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/sticker-123'
    );
    const params = Promise.resolve({ orderId: 'sticker-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Perfil de emergencia no encontrado',
    });
  });

  it('handles database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');
    vi.mocked(prisma.sticker.findFirst).mockRejectedValue(mockError);

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/sticker-123'
    );
    const params = Promise.resolve({ orderId: 'sticker-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error',
      details: 'Database connection failed',
    });
  });

  it('uses fallback URL when environment variable not set', async () => {
    // Remove environment variable
    delete process.env.NEXT_PUBLIC_MAIN_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;

    const mockSticker = {
      id: 'sticker-123',
      slug: 'test-slug',
      status: 'ACTIVE' as const,
    } as never;

    const mockEmergencyUrl = 'https://safetap.cl/qr/emergency-profile-456';

    vi.mocked(prisma.sticker.findFirst).mockResolvedValue(mockSticker);
    vi.mocked(getEmergencyProfileUrlForSticker).mockResolvedValue(
      mockEmergencyUrl
    );

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/sticker-123'
    );
    const params = Promise.resolve({ orderId: 'sticker-123' });

    await GET(request, { params });

    // Verify fallback URL was used
    expect(getEmergencyProfileUrlForSticker).toHaveBeenCalledWith(
      'sticker-123',
      'https://safetap.cl'
    );
  });

  it('prioritizes NEXT_PUBLIC_MAIN_APP_URL over NEXT_PUBLIC_BASE_URL', async () => {
    process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://main-app.safetap.cl';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://base.safetap.cl';

    const mockSticker = {
      id: 'sticker-123',
      slug: 'test-slug',
      status: 'ACTIVE' as const,
    } as never;

    const mockEmergencyUrl =
      'https://main-app.safetap.cl/qr/emergency-profile-456';

    vi.mocked(prisma.sticker.findFirst).mockResolvedValue(mockSticker);
    vi.mocked(getEmergencyProfileUrlForSticker).mockResolvedValue(
      mockEmergencyUrl
    );

    const request = new NextRequest(
      'http://localhost:3001/api/admin/emergency-profile-url/sticker-123'
    );
    const params = Promise.resolve({ orderId: 'sticker-123' });

    await GET(request, { params });

    // Verify main app URL was prioritized
    expect(getEmergencyProfileUrlForSticker).toHaveBeenCalledWith(
      'sticker-123',
      'https://main-app.safetap.cl'
    );
  });
});
