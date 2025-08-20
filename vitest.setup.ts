import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

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

// Set test environment variables to prevent real email sending
// Use vi.stubEnv to ensure these override any .env files
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('EMAIL_SERVER_HOST', 'mock-smtp.test.localhost');
vi.stubEnv('EMAIL_SERVER_USER', 'test@mock.localhost');
vi.stubEnv('EMAIL_SERVER_PASSWORD', 'mock-password-123');
vi.stubEnv('EMAIL_FROM', 'SafeTap Test <test@mock.localhost>');
vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing-only');
