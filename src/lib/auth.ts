import NextAuth, { type NextAuthOptions, getServerSession } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: 'database' },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!,
      maxAge: 24 * 60 * 60,
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
  pages: {
    signIn: '/login',
  },
};

export const auth = () => getServerSession(authOptions);

export default NextAuth(authOptions);
