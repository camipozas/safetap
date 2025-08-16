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
          user: process.env.EMAIL_SERVER_USER || 'no-reply@safetap.cl',
          pass: process.env.EMAIL_SERVER_PASSWORD || process.env.EMAIL_PASSWORD,
        },
        secure: false,
        tls: {
          rejectUnauthorized: false
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 24 * 60 * 60,
      // sendVerificationRequest: Se usa /api/custom-login en lugar de este provider
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
