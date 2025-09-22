import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMainAppUrl, getQrUrlForSticker } from '@/lib/url-utils';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:3001',
  protocol: 'http:',
  hostname: 'localhost',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('URL Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_MAIN_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BACKOFFICE_PORT;
    delete process.env.NEXT_PUBLIC_MAINAPP_PORT;

    // Reset window.location mock
    mockLocation.origin = 'http://localhost:3001';
    mockLocation.protocol = 'http:';
    mockLocation.hostname = 'localhost';
  });

  describe('getMainAppUrl', () => {
    describe('client-side behavior', () => {
      it('returns NEXT_PUBLIC_MAIN_APP_URL when set', () => {
        process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';

        const url = getMainAppUrl();

        expect(url).toBe('https://safetap.cl');
      });

      it('uses client-side logic when main app URL not set', () => {
        process.env.NEXT_PUBLIC_BASE_URL = 'https://base.safetap.cl';
        // When NEXT_PUBLIC_MAIN_APP_URL is not set, but we're in browser,
        // it will still use the client-side logic with localhost

        const url = getMainAppUrl();

        // Since we're in a browser environment (window exists), it uses client-side logic
        expect(url).toBe('http://localhost:3000');
      });

      it('uses default localhost with port 3000 when no env vars set', () => {
        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:3000');
      });

      it('uses custom main app port when NEXT_PUBLIC_MAINAPP_PORT is set', () => {
        process.env.NEXT_PUBLIC_MAINAPP_PORT = '4000';

        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:4000');
      });

      it('replaces backoffice port with main app port on localhost', () => {
        process.env.NEXT_PUBLIC_BACKOFFICE_PORT = '3001';
        process.env.NEXT_PUBLIC_MAINAPP_PORT = '3000';
        mockLocation.origin = 'http://localhost:3001';

        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:3000');
      });

      it('handles custom ports correctly', () => {
        process.env.NEXT_PUBLIC_BACKOFFICE_PORT = '8001';
        process.env.NEXT_PUBLIC_MAINAPP_PORT = '8000';
        mockLocation.origin = 'http://localhost:8001';

        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:8000');
      });

      it('returns protocol and hostname without port for production domains', () => {
        mockLocation.protocol = 'https:';
        mockLocation.hostname = 'admin.safetap.cl';

        const url = getMainAppUrl();

        expect(url).toBe('https://admin.safetap.cl');
      });

      it('handles 127.0.0.1 like localhost', () => {
        process.env.NEXT_PUBLIC_BACKOFFICE_PORT = '3001';
        process.env.NEXT_PUBLIC_MAINAPP_PORT = '3000';
        mockLocation.hostname = '127.0.0.1';
        mockLocation.origin = 'http://127.0.0.1:3001';

        const url = getMainAppUrl();

        expect(url).toBe('http://127.0.0.1:3000');
      });
    });

    describe('server-side behavior', () => {
      let originalWindow: typeof window | undefined;

      beforeEach(() => {
        // Mock server-side environment by removing window
        originalWindow = (
          global as typeof globalThis & { window?: typeof window }
        ).window;
        // @ts-expect-error - Deleting window property for server-side simulation
        delete (global as typeof globalThis & { window?: typeof window })
          .window;
      });

      afterEach(() => {
        // Restore window
        if (originalWindow) {
          (global as typeof globalThis & { window?: typeof window }).window =
            originalWindow;
        }
      });

      it('returns NEXT_PUBLIC_MAIN_APP_URL when set on server', () => {
        process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';

        const url = getMainAppUrl();

        expect(url).toBe('https://safetap.cl');
      });

      it('falls back to NEXT_PUBLIC_BASE_URL when main app URL not set on server', () => {
        process.env.NEXT_PUBLIC_BASE_URL = 'https://base.safetap.cl';

        const url = getMainAppUrl();

        expect(url).toBe('https://base.safetap.cl');
      });

      it('uses default localhost on server when no env vars set', () => {
        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:3000');
      });

      it('uses custom main app port on server when NEXT_PUBLIC_MAINAPP_PORT is set', () => {
        process.env.NEXT_PUBLIC_MAINAPP_PORT = '4000';

        const url = getMainAppUrl();

        expect(url).toBe('http://localhost:4000');
      });
    });
  });

  describe('getQrUrlForSticker', () => {
    it('returns emergency profile URL when API call succeeds', async () => {
      const mockEmergencyUrl = 'https://safetap.cl/qr/emergency-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ emergencyUrl: mockEmergencyUrl }),
      });

      const url = await getQrUrlForSticker('sticker-123', 'test-slug');

      expect(url).toBe(mockEmergencyUrl);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/emergency-profile-url/sticker-123'
      );
    });

    it('falls back to slug URL when API call fails', async () => {
      process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const url = await getQrUrlForSticker('sticker-123', 'test-slug');

      expect(url).toBe('https://safetap.cl/s/test-slug');
    });

    it('falls back to slug URL when API throws error', async () => {
      process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const url = await getQrUrlForSticker('sticker-123', 'test-slug');

      expect(url).toBe('https://safetap.cl/s/test-slug');
    });

    it('uses missing-slug fallback when no fallback slug provided', async () => {
      process.env.NEXT_PUBLIC_MAIN_APP_URL = 'https://safetap.cl';
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const url = await getQrUrlForSticker('sticker-123');

      expect(url).toBe('https://safetap.cl/s/missing-slug');
    });

    it('uses dynamic main app URL in fallback', async () => {
      // No environment variables set, should use localhost:3000
      // But the current mock location hostname affects the result
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const url = await getQrUrlForSticker('sticker-123', 'test-slug');

      // The actual hostname from mock location is used
      expect(url).toBe('http://localhost:3000/s/test-slug');
    });
  });
});
