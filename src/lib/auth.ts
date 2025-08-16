import NextAuth, { type NextAuthOptions, getServerSession, type Session, type User, type Account, type Profile } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

console.log('🔧 [AUTH CONFIG] Loading authOptions...');

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: 'database' },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        auth: {
          user: process.env.EMAIL_SERVER_USER || 'camila@safetap.cl',
          pass: process.env.EMAIL_SERVER_PASSWORD || process.env.EMAIL_PASSWORD || 'uamyrbelnpmjkyjn',
        },
        secure: false,
        tls: {
          rejectUnauthorized: false
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        console.log('🔥🔥🔥 [CUSTOM EMAIL] sendVerificationRequest called!');
        console.log('📧 Sending email to:', identifier);
        console.log('🔗 Login URL:', url);
        console.log('📮 Provider config:', JSON.stringify(provider, null, 2));
        
        try {
          const nodemailer = require('nodemailer');
          
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
              user: 'camila@safetap.cl',
              pass: process.env.EMAIL_PASSWORD || 'uamyrbelnpmjkyjn',
            },
            secure: false,
            tls: {
              rejectUnauthorized: false
            },
          });
          
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
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user) {
        (session.user as User & { id: string; role?: string }).id = user.id;
        (session.user as User & { id: string; role?: string }).role = (user as User & { role?: string }).role ?? 'USER';
      }
      return session;
    },
  },
  events: {
    async signIn({ user }: { user: User; account: Account | null; profile?: Profile; isNewUser?: boolean }) {
      console.log('✅ User signed in:', user.email);
    },
    async createUser({ user }: { user: User }) {
      console.log('👤 New user created:', user.email);
    },
  },
  logger: {
    error(code: string, metadata?: unknown) {
      console.error('🔴 NextAuth Error:', code, metadata);
    },
    warn(code: string) {
      console.warn('🟡 NextAuth Warning:', code);
    },
    debug(code: string, metadata?: unknown) {
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
