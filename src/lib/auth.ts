import NextAuth, { type NextAuthOptions, getServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: 'database' },
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'camila@safetap.cl',
          pass: process.env.EMAIL_PASSWORD || 'uamyrbelnpmjkyjn',
        },
        secure: false, // true for 465, false for other ports
        tls: {
          rejectUnauthorized: false
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 24 * 60 * 60,
      // Add debugging
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        console.log('📧 Sending email to:', identifier);
        console.log('🔗 Login URL:', url);
        console.log('📮 Provider config:', provider.from);
        
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport(provider.server);
          
          const result = await transporter.sendMail({
            to: identifier,
            from: provider.from,
            subject: 'Inicia sesión en SafeTap',
            text: `Inicia sesión en SafeTap\n\nHaz clic en el siguiente enlace para iniciar sesión:\n${url}\n\nEste enlace expira en 24 horas.\n\nSi no solicitaste este email, puedes ignorarlo.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3b82f6;">SafeTap</h1>
                <h2>Inicia sesión en tu cuenta</h2>
                <p>Haz clic en el botón de abajo para iniciar sesión en SafeTap:</p>
                <a href="${url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">
                  Iniciar Sesión
                </a>
                <p style="color: #666; font-size: 14px;">
                  Este enlace expira en 24 horas. Si no solicitaste este email, puedes ignorarlo.
                </p>
                <p style="color: #666; font-size: 12px;">
                  O copia y pega este enlace en tu navegador: ${url}
                </p>
              </div>
            `,
          });
          
          console.log('✅ Email sent successfully:', result.messageId);
          return result;
        } catch (error) {
          console.error('❌ Email sending failed:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = (user as any).id as string;
        (session.user as any).role = (user as any).role ?? 'USER';
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('✅ User signed in:', user.email);
    },
    async createUser({ user }) {
      console.log('👤 New user created:', user.email);
    },
  },
  logger: {
    error(code, metadata) {
      console.error('🔴 NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('🟡 NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔵 NextAuth Debug:', code, metadata);
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export const auth = () => getServerSession(authOptions);

export default NextAuth(authOptions);
