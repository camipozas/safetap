import cuid from 'cuid';
import NextAuth, { NextAuthOptions, getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/prisma';
import { USER_ROLES } from '@/types/shared';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Sign-in attempt:', {
        email: user.email,
        name: user.name,
        provider: account?.provider,
        accountId: account?.providerAccountId,
        profileId: profile?.sub,
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
            console.log('ℹ️ Creating new user with Google profile:', user.name);
            const newUser = await prisma.user.create({
              data: {
                id: cuid(),
                email: user.email!,
                name: user.name || user.email!.split('@')[0] || 'Usuario',
                role: USER_ROLES.USER,
                emailVerified: new Date(),
                updatedAt: new Date(),
              },
            });
            console.log('✅ New user created:', newUser.id);
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
    async jwt({ token, user }) {
      if (user && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.country = dbUser.country;
            token.totalSpent = dbUser.totalSpent;
            token.emailVerified = dbUser.emailVerified;
          }
        } catch (error) {
          console.error('❌ Error fetching user data for JWT:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role =
          (token.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN') || USER_ROLES.USER;
        session.user.country = token.country as string;
        session.user.totalSpent = (token.totalSpent as number) || 0;
        session.user.emailVerified = token.emailVerified as Date | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        // Relative URL - prepend base URL
        const finalUrl = `${baseUrl}${url}`;
        return finalUrl;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      const accountUrl = `${baseUrl}/account`;
      return accountUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const auth = () => getServerSession(authOptions);
