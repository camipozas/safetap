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
Object.assign(process.env, {
  NODE_ENV: 'test',
  EMAIL_SERVER_HOST: 'mock-smtp.test.localhost',
  EMAIL_SERVER_USER: 'test@mock.localhost',
  EMAIL_SERVER_PASSWORD: 'mock-password-123',
  EMAIL_FROM: 'SafeTap Test <test@mock.localhost>',
  NEXTAUTH_SECRET: 'test-secret-key-for-testing-only',
});
