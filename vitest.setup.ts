import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

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

// Make React available globally for JSX
globalThis.React = React;

// Set test environment variables to prevent real email sending
process.env.NODE_ENV = 'test';
process.env.EMAIL_SERVER_HOST = 'mock-smtp.test.localhost';
process.env.EMAIL_SERVER_USER = 'test@mock.localhost';
process.env.EMAIL_SERVER_PASSWORD = 'mock-password-123';
process.env.EMAIL_FROM = 'SafeTap Test <test@mock.localhost>';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}));
