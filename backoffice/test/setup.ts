import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
vi.stubEnv('NEXTAUTH_BACKOFFICE_URL', 'http://localhost:3001');

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  usePathname() {
    return '/dashboard';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'SUPER_ADMIN',
        },
      },
      status: 'authenticated',
    };
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sticker: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    emergencyProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    emergencyContact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    adminInvitation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock global fetch with default responses
global.fetch = vi.fn((url: string) => {
  // Check the URL to return appropriate response
  if (typeof url === 'string' && url.includes('/api/admin/admin-users')) {
    // For admin users API, return array directly
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  } else if (
    typeof url === 'string' &&
    url.includes('/api/admin/invitations')
  ) {
    // For invitations API, return object with invitations array
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ invitations: [] }),
    });
  } else {
    // Default response for other endpoints
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  }
}) as any;
