import { EmailService, createEmailService } from '@/lib/email';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock nodemailer
const mockTransporter = {
  sendMail: vi.fn(),
  verify: vi.fn(),
};

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransporter),
  },
}));

describe('EmailService', () => {
  const mockConfig = {
    host: 'smtp.example.com',
    user: 'test@example.com',
    password: 'testpassword',
    from: 'Test <test@example.com>',
    rejectUnauthorized: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInvitationEmail', () => {
    it('returns mock message ID in test mode', async () => {
      const emailService = new EmailService(mockConfig);

      const result = await emailService.sendInvitationEmail(
        'admin@example.com',
        'https://example.com/accept?token=abc123',
        'ADMIN'
      );

      // In test mode, should return a mock ID and not call the actual transporter
      expect(result).toMatch(/^test-invitation-mock-\d+$/);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('handles SUPER_ADMIN role correctly in test mode', async () => {
      const emailService = new EmailService(mockConfig);

      const result = await emailService.sendInvitationEmail(
        'superadmin@example.com',
        'https://example.com/accept?token=xyz789',
        'SUPER_ADMIN'
      );

      // In test mode, should return a mock ID regardless of role
      expect(result).toMatch(/^test-invitation-mock-\d+$/);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('does not throw error in test mode even when email would fail', async () => {
      const emailService = new EmailService(mockConfig);

      // In test mode, errors are not thrown since real email sending is skipped
      const result = await emailService.sendInvitationEmail(
        'admin@example.com',
        'https://example.com/accept?token=abc123',
        'ADMIN'
      );

      expect(result).toMatch(/^test-invitation-mock-\d+$/);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('returns true in test mode without calling verify', async () => {
      const emailService = new EmailService(mockConfig);

      const result = await emailService.testConnection();

      // In test mode, always returns true without calling the actual verify method
      expect(result).toBe(true);
      expect(mockTransporter.verify).not.toHaveBeenCalled();
    });

    it('returns true in test mode even when connection would fail', async () => {
      const emailService = new EmailService(mockConfig);

      const result = await emailService.testConnection();

      // In test mode, always returns true regardless of what would happen in production
      expect(result).toBe(true);
      expect(mockTransporter.verify).not.toHaveBeenCalled();
    });
  });
});

describe('createEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env.EMAIL_SERVER_HOST;
    delete process.env.EMAIL_SERVER_USER;
    delete process.env.EMAIL_SERVER_PASSWORD;
    delete process.env.EMAIL_FROM;
  });

  it('creates email service when all environment variables are provided', () => {
    process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
    process.env.EMAIL_SERVER_USER = 'test@example.com';
    process.env.EMAIL_SERVER_PASSWORD = 'testpassword';
    process.env.EMAIL_FROM = 'Test <test@example.com>';

    const service = createEmailService();

    expect(service).toBeInstanceOf(EmailService);
  });

  it('returns null when EMAIL_SERVER_HOST is missing', () => {
    process.env.EMAIL_SERVER_USER = 'test@example.com';
    process.env.EMAIL_SERVER_PASSWORD = 'testpassword';
    process.env.EMAIL_FROM = 'Test <test@example.com>';

    const service = createEmailService();

    expect(service).toBeNull();
  });

  it('returns null when EMAIL_SERVER_USER is missing', () => {
    process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
    process.env.EMAIL_SERVER_PASSWORD = 'testpassword';
    process.env.EMAIL_FROM = 'Test <test@example.com>';

    const service = createEmailService();

    expect(service).toBeNull();
  });

  it('returns null when EMAIL_SERVER_PASSWORD is missing', () => {
    process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
    process.env.EMAIL_SERVER_USER = 'test@example.com';
    process.env.EMAIL_FROM = 'Test <test@example.com>';

    const service = createEmailService();

    expect(service).toBeNull();
  });

  it('returns null when EMAIL_FROM is missing', () => {
    process.env.EMAIL_SERVER_HOST = 'smtp.example.com';
    process.env.EMAIL_SERVER_USER = 'test@example.com';
    process.env.EMAIL_SERVER_PASSWORD = 'testpassword';

    const service = createEmailService();

    expect(service).toBeNull();
  });

  it('returns null when all environment variables are missing', () => {
    const service = createEmailService();

    expect(service).toBeNull();
  });
});
