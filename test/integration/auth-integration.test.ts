import { describe, expect, it, vi } from 'vitest';

import { authOptions } from '@/lib/auth';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Auth Integration', () => {
  describe('Redirect Callback', () => {
    it('redirects to welcome with CTA after login', async () => {
      const mockUrl = '/dashboard';
      const mockBaseUrl = 'http://localhost:3000';

      const redirectResult = await authOptions.callbacks?.redirect?.({
        url: mockUrl,
        baseUrl: mockBaseUrl,
      });

      expect(redirectResult).toBe('http://localhost:3000/welcome?cta=sticker');
    });

    it('redirects to welcome with CTA for root URLs', async () => {
      const mockUrl = '/';
      const mockBaseUrl = 'http://localhost:3000';

      const redirectResult = await authOptions.callbacks?.redirect?.({
        url: mockUrl,
        baseUrl: mockBaseUrl,
      });

      expect(redirectResult).toBe('http://localhost:3000/welcome?cta=sticker');
    });
  });
});
