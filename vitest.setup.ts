// Set test environment variables FIRST to prevent real email sending and configure Prisma
// Use vi.stubEnv to ensure these override any .env files
import React from 'react';
import { vi } from 'vitest';

vi.stubEnv('NODE_ENV', 'test');
// Use PostgreSQL test database URL or fallback to in-memory SQLite for unit tests
vi.stubEnv(
  'DATABASE_URL',
  process.env.TEST_DATABASE_URL ||
    'postgresql://test:test@localhost:5432/safetap_test'
);
vi.stubEnv(
  'DIRECT_URL',
  process.env.TEST_DATABASE_URL ||
    'postgresql://test:test@localhost:5432/safetap_test'
);
vi.stubEnv('EMAIL_SERVER_HOST', 'mock-smtp.test.localhost');
vi.stubEnv('EMAIL_SERVER_USER', 'test@mock.localhost');
vi.stubEnv('EMAIL_SERVER_PASSWORD', 'mock-password-123');
vi.stubEnv('EMAIL_FROM', 'SafeTap Test <test@mock.localhost>');
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing-only');

import '@testing-library/jest-dom';

// Make React available globally for JSX
globalThis.React = React;

// Mock Next.js router and navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    entries: vi.fn(),
    forEach: vi.fn(),
    toString: vi.fn(),
  }),
  usePathname: () => '/test-path',
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Hoist nodemailer mock to the top to ensure it's applied early
vi.mock('nodemailer', async () => {
  const mockTransporter = {
    sendMail: vi.fn().mockResolvedValue({
      messageId: `mock-message-id-${Date.now()}`,
      accepted: ['test@example.com'],
      rejected: [],
      pending: [],
      response: '250 Mock OK - Email not sent in tests',
    }),
    verify: vi.fn().mockResolvedValue(true),
  };

  return {
    default: {
      createTransport: vi.fn(() => {
        console.log(
          '🚫 Mock nodemailer.createTransport called - no real email will be sent'
        );
        return mockTransporter;
      }),
    },
  };
});
