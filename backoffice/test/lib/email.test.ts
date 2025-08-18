import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmailService, EmailService } from '@/lib/email';

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
    it('sends invitation email successfully', async () => {
      const emailService = new EmailService(mockConfig);
      const expectedMessageId = 'test-message-id-123';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: expectedMessageId,
      });

      const result = await emailService.sendInvitationEmail(
        'admin@example.com',
        'https://example.com/accept?token=abc123',
        'ADMIN'
      );

      expect(result).toBe(expectedMessageId);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'admin@example.com',
        from: mockConfig.from,
        subject: 'Invitación para unirse al Panel de Administración - SafeTap',
        text: expect.stringContaining(
          'Has sido invitado/a a unirte al panel de administración'
        ),
        html: expect.stringContaining(
          'Has sido invitado/a a unirte al panel de administración'
        ),
      });

      // Verify text content includes role and URL
      const textContent = mockTransporter.sendMail.mock.calls[0][0].text;
      expect(textContent).toContain('ADMIN');
      expect(textContent).toContain('https://example.com/accept?token=abc123');

      // Verify HTML content includes role and URL
      const htmlContent = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(htmlContent).toContain('ADMIN');
      expect(htmlContent).toContain('https://example.com/accept?token=abc123');
    });

    it('handles SUPER_ADMIN role correctly', async () => {
      const emailService = new EmailService(mockConfig);

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await emailService.sendInvitationEmail(
        'superadmin@example.com',
        'https://example.com/accept?token=xyz789',
        'SUPER_ADMIN'
      );

      const textContent = mockTransporter.sendMail.mock.calls[0][0].text;
      const htmlContent = mockTransporter.sendMail.mock.calls[0][0].html;

      expect(textContent).toContain('SUPER_ADMIN');
      expect(htmlContent).toContain('SUPER_ADMIN');
    });

    it('throws error when email sending fails', async () => {
      const emailService = new EmailService(mockConfig);
      const expectedError = new Error('SMTP connection failed');

      mockTransporter.sendMail.mockRejectedValue(expectedError);

      await expect(
        emailService.sendInvitationEmail(
          'admin@example.com',
          'https://example.com/accept?token=abc123',
          'ADMIN'
        )
      ).rejects.toThrow('SMTP connection failed');
    });
  });

  describe('testConnection', () => {
    it('returns true when connection is successful', async () => {
      const emailService = new EmailService(mockConfig);

      mockTransporter.verify.mockResolvedValue(true);

      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('returns false when connection fails', async () => {
      const emailService = new EmailService(mockConfig);

      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
      expect(mockTransporter.verify).toHaveBeenCalled();
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
