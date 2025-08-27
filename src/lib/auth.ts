import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { environment } from '@/environment/config';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: environment.auth.googleClientId!,
      clientSecret: environment.auth.googleClientSecret!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      httpOptions: {
        timeout: 40000,
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/login',
    verifyRequest: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Sign-in attempt:', {
        email: user.email,
        name: user.name,
        provider: account?.provider,
        accountId: account?.providerAccountId,
        profileId: profile?.sub,
        environment: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL,
      });

      if (account?.provider === 'google') {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            console.log('✅ Existing user found:', {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role,
            });

            // Update user with name from Google if they don't have one
            if (!existingUser.name && user.name) {
              await prisma.user.update({
                where: { email: user.email! },
                data: {
                  name: user.name,
                  updatedAt: new Date(),
                },
              });
              console.log(
                '✅ Updated user name from Google profile:',
                user.name
              );
            }
          } else {
            console.log(
              'ℹ️ New user will be created with Google name:',
              user.name
            );
          }

          console.log('✅ Google sign-in allowed for:', user.email);
          return true;
        } catch (error) {
          console.error('❌ Error during sign-in check:', error);
          return false;
        }
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
      if (session?.user?.email && user) {
        session.user.id = user.id;
        session.user.role = user.role as typeof session.user.role;
        session.user.country = user.country || undefined;
        session.user.totalSpent = user.totalSpent || 0;
        session.user.emailVerified = user.emailVerified || undefined;
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
  secret: environment.auth.secret,
};

export const auth = () => getServerSession(authOptions);
