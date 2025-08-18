/* eslint-disable no-console */
import nodemailer from 'nodemailer';

const invitationEmailMessages = {
  subject: 'Invitación para unirse al Panel de Administración - SafeTap',
  text: (inviteUrl: string, role: string) =>
    `Invitación para unirse al Panel de Administración - SafeTap\n\nHas sido invitado/a a unirte al panel de administración de SafeTap como ${role}.\n\nHaz clic en el siguiente enlace para aceptar la invitación:\n${inviteUrl}\n\nEste enlace expira en 24 horas.\n\nSi no esperabas esta invitación, puedes ignorar este email.`,
  html: (inviteUrl: string, role: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3b82f6; margin: 0;">SafeTap</h1>
        <h2 style="color: #374151; font-weight: 500; margin: 10px 0;">Panel de Administración</h2>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #374151; margin-top: 0;">Invitación para unirse al equipo</h3>
        <p style="color: #6b7280; line-height: 1.6;">
          Has sido invitado/a a unirte al panel de administración de SafeTap con el rol de <strong>${role}</strong>.
        </p>
        <p style="color: #6b7280; line-height: 1.6;">
          Para aceptar la invitación y completar tu registro, haz clic en el botón de abajo:
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" 
           style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; font-size: 16px;">
          Aceptar Invitación
        </a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
        <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0;">
          <strong>Información importante:</strong><br>
          • Este enlace expira en 24 horas<br>
          • Solo puede ser utilizado una vez<br>
          • Si no esperabas esta invitación, puedes ignorar este email
        </p>
        
        <div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0; word-break: break-all;">
            Link directo: ${inviteUrl}
          </p>
        </div>
      </div>
    </div>
  `,
};

export interface EmailConfig {
  host: string;
  user: string;
  password: string;
  from: string;
  rejectUnauthorized: boolean;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.config.host,
      port: 587,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
      secure: false,
      tls: {
        rejectUnauthorized: this.config.rejectUnauthorized,
      },
    });
  }

  async sendInvitationEmail(
    email: string,
    inviteUrl: string,
    role: string
  ): Promise<string> {
    const transporter = this.createTransporter();

    const result = await transporter.sendMail({
      to: email,
      from: this.config.from,
      subject: invitationEmailMessages.subject,
      text: invitationEmailMessages.text(inviteUrl, role),
      html: invitationEmailMessages.html(inviteUrl, role),
    });

    return result.messageId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

export function createEmailService(): EmailService | null {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const password = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM;

  const rejectUnauthorized = process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false';

  if (!host || !user || !password || !from) {
    console.error(
      'Email configuration missing. Required environment variables:'
    );
    console.error('- EMAIL_SERVER_HOST');
    console.error('- EMAIL_SERVER_USER');
    console.error('- EMAIL_SERVER_PASSWORD');
    console.error('- EMAIL_FROM');
    console.error('Optional:');
    console.error('- EMAIL_REJECT_UNAUTHORIZED (default: true)');
    return null;
  }

  if (!rejectUnauthorized) {
    console.warn(
      '⚠️ SECURITY WARNING: TLS certificate validation is disabled (EMAIL_REJECT_UNAUTHORIZED=false). ' +
        'This should only be used in development environments.'
    );
  }

  return new EmailService({ host, user, password, from, rejectUnauthorized });
}
