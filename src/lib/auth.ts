import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        console.warn('Google sign-in attempt for:', user.email);
        return true;
      }
      return false;
    },
    async redirect({ url, baseUrl }) {
      // If user is trying to go to a callback URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If URL is from same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to /account page after successful login
      return `${baseUrl}/account`;
    },
    async session({ session, user }) {
      if (session.user && user) {
        // Get additional user info from database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: {
              id: true,
              role: true,
              country: true,
              totalSpent: true,
              emailVerified: true,
            },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.country = dbUser.country || undefined;
            session.user.totalSpent = dbUser.totalSpent;
            session.user.emailVerified = dbUser.emailVerified || undefined;
          } else {
            // Fallback to basic user info
            session.user.id = user.id;
            session.user.role = 'USER';
            session.user.totalSpent = 0;
          }
        } catch (error) {
          console.warn('Error fetching user from database:', error);
          // Fallback to basic user info
          session.user.id = user.id;
          session.user.role = 'USER';
          session.user.totalSpent = 0;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const auth = () => getServerSession(authOptions);
