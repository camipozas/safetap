import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/qr/profile/[profileId]/route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emergencyProfile: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('console', () => ({
  log: vi.fn(),
  error: vi.fn(),
}));

const originalEnv = process.env;
beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/qr/profile/[profileId]', () => {
  describe('GET - Get Profile QR URL', () => {
    it('successfully generates QR URL for active profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        consentPublic: true,
        Sticker: {
          id: 'sticker-123',
          slug: 'test-slug',
          serial: 'STK-TEST123',
          status: 'ACTIVE',
        },
        User: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
        mockProfile as never
      );
      process.env.NEXT_PUBLIC_BASE_URL = 'https://test.safetap.cl';

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-123'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'profile-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profileId).toBe('profile-123');
      expect(data.qrUrl).toBe('https://test.safetap.cl/qr/profile-123');
      expect(data.stickerInfo.status).toBe('ACTIVE');
      expect(data.stickerInfo.serial).toBe('STK-TEST123');
      expect(data.userInfo.name).toBe('Test User');
      expect(data.userInfo.email).toBe('test@example.com');
      expect(data.isPublic).toBe(true);
    });

    it('uses default base URL when env variable not set', async () => {
      const mockProfile = {
        id: 'profile-456',
        consentPublic: true,
        Sticker: {
          id: 'sticker-456',
          slug: 'test-slug-456',
          serial: 'STK-TEST456',
          status: 'ACTIVE',
        },
        User: {
          id: 'user-456',
          name: 'Test User 2',
          email: 'test2@example.com',
        },
      };

      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
        mockProfile as never
      );
      delete process.env.NEXT_PUBLIC_BASE_URL;

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-456'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'profile-456' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.qrUrl).toBe('https://safetap.cl/qr/profile-456');
    });

    it('returns 404 when profile not found', async () => {
      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/qr/profile/nonexistent'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Perfil no encontrado o no activo');
    });

    it('returns 404 when profile exists but sticker is not active', async () => {
      // The query will not return this profile because it filters by ACTIVE status
      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-inactive'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'profile-inactive' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Perfil no encontrado o no activo');
    });

    it('returns 404 when profile exists but consent is not public', async () => {
      // The query will not return this profile because it filters by consentPublic: true
      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-private'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'profile-private' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Perfil no encontrado o no activo');
    });

    it('returns 404 when profile has no sticker', async () => {
      const mockProfile = {
        id: 'profile-no-sticker',
        consentPublic: true,
        sticker: null, // No sticker associated
        user: {
          id: 'user-no-sticker',
          name: 'No Sticker User',
          email: 'nosticker@example.com',
        },
      };

      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
        mockProfile as never
      );

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-no-sticker'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'profile-no-sticker' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Perfil no encontrado o no activo');
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(prisma.emergencyProfile.findFirst).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost/api/qr/profile/error-profile'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'error-profile' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('handles unknown errors gracefully', async () => {
      vi.mocked(prisma.emergencyProfile.findFirst).mockRejectedValue(
        'Unknown error type'
      );

      const request = new NextRequest(
        'http://localhost/api/qr/profile/unknown-error'
      );
      const response = await GET(request, {
        params: Promise.resolve({ profileId: 'unknown-error' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error desconocido');
    });

    it('correctly calls prisma with expected query parameters', async () => {
      const mockProfile = {
        id: 'profile-query-test',
        consentPublic: true,
        Sticker: {
          id: 'sticker-query-test',
          slug: 'query-test-slug',
          serial: 'STK-QUERY',
          status: 'ACTIVE',
        },
        User: {
          id: 'user-query-test',
          name: 'Query Test User',
          email: 'querytest@example.com',
        },
      };

      vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
        mockProfile as never
      );

      const request = new NextRequest(
        'http://localhost/api/qr/profile/profile-query-test'
      );
      await GET(request, {
        params: Promise.resolve({ profileId: 'profile-query-test' }),
      });

      expect(prisma.emergencyProfile.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'profile-query-test',
          consentPublic: true,
          Sticker: {
            status: 'ACTIVE',
            Payment: {
              some: {
                status: {
                  in: ['VERIFIED', 'PAID'],
                },
              },
            },
          },
        },
        include: {
          Sticker: {
            select: {
              id: true,
              slug: true,
              serial: true,
              status: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });
});
