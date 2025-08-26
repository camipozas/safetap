// Set test environment variables FIRST to prevent real email sending and configure Prisma
// Use vi.stubEnv to ensure these override any .env files
import React from 'react';
import { vi } from 'vitest';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('DATABASE_URL', 'file:./test.db');
vi.stubEnv('DIRECT_URL', 'file:./test.db');
vi.stubEnv('EMAIL_SERVER_HOST', 'mock-smtp.test.localhost');
vi.stubEnv('EMAIL_SERVER_USER', 'test@mock.localhost');
vi.stubEnv('EMAIL_SERVER_PASSWORD', 'mock-password-123');
vi.stubEnv('EMAIL_FROM', 'SafeTap Test <test@mock.localhost>');
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing-only');

import '@testing-library/jest-dom';

// Make React available globally for JSX
globalThis.React = React;

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
