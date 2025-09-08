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
    it('handles dashboard URLs correctly', async () => {
      const mockUrl = '/dashboard';
      const mockBaseUrl = 'http://localhost:3000';

      const redirectResult = await authOptions.callbacks?.redirect?.({
        url: mockUrl,
        baseUrl: mockBaseUrl,
      });

      expect(redirectResult).toBe('http://localhost:3000/dashboard');
    });

    it('handles root URLs correctly', async () => {
      const mockUrl = '/';
      const mockBaseUrl = 'http://localhost:3000';

      const redirectResult = await authOptions.callbacks?.redirect?.({
        url: mockUrl,
        baseUrl: mockBaseUrl,
      });

      expect(redirectResult).toBe('http://localhost:3000/');
    });
  });
});
