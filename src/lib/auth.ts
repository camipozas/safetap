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
      console.log('🔐 Sign-in attempt:', {
        email: user.email,
        provider: account?.provider,
      });
      if (account?.provider === 'google') {
        console.log('✅ Google sign-in allowed for:', user.email);
        return true;
      }
      console.log(
        '❌ Sign-in rejected - unsupported provider:',
        account?.provider
      );
      return false;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔀 Auth redirect:', { url, baseUrl });
      // If user is trying to go to a callback URL
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`;
        console.log('✅ Redirecting to relative URL:', finalUrl);
        return finalUrl;
      }
      // If URL is from same origin
      if (new URL(url).origin === baseUrl) {
        console.log('✅ Redirecting to same origin URL:', url);
        return url;
      }
      // Default to /account page after successful login
      const defaultUrl = `${baseUrl}/account`;
      console.log('✅ Redirecting to default account page:', defaultUrl);
      return defaultUrl;
    },
    async session({ session, user }) {
      console.log('👤 Creating session for user:', session.user?.email);
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
            console.log('✅ User found in database:', {
              id: dbUser.id,
              role: dbUser.role,
              country: dbUser.country,
            });
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            session.user.country = dbUser.country || undefined;
            session.user.totalSpent = dbUser.totalSpent;
            session.user.emailVerified = dbUser.emailVerified || undefined;
          } else {
            console.log('⚠️ User not found in database, using fallback');
            // Fallback to basic user info
            session.user.id = user.id;
            session.user.role = 'USER';
            session.user.totalSpent = 0;
          }
        } catch (error) {
          console.error('❌ Error fetching user from database:', error);
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
