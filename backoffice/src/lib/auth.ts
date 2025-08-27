import { hasPermission } from '@/types/shared';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { environment } from '@/environment/config';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: environment.auth.googleClientId!,
      clientSecret: environment.auth.googleClientSecret!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      console.log('🔐 Backoffice sign-in attempt:', {
        email: user.email,
        provider: account?.provider,
      });

      if (account?.provider === 'google') {
        console.log('🔍 Looking up user in database:', user.email);
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          console.log('✅ User found in database:', {
            id: dbUser.id,
            role: dbUser.role,
          });
          if (hasPermission(dbUser.role, 'canAccessBackoffice')) {
            console.log('✅ User has backoffice access permissions');
            try {
              await prisma.user.update({
                where: { email: user.email! },
                data: { lastLoginAt: new Date() },
              });
              console.log('✅ Updated last login timestamp');
            } catch (error) {
              console.error('❌ Failed to update last login:', error);
              return false;
            }
            return true;
          } else {
            console.log('❌ User lacks backoffice permissions:', dbUser.role);
            return false;
          }
        } else {
          console.log('❌ User not found in database:', user.email);
          return false;
        }
      }
      console.log('❌ Unsupported sign-in provider:', account?.provider);
      return false;
    },
    session: async ({ session, user }) => {
      console.log(
        '👤 Creating backoffice session for user:',
        session.user?.email
      );
      if (session?.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (!dbUser || !hasPermission(dbUser.role, 'canAccessBackoffice')) {
          console.log('❌ Access denied - user lacks admin privileges:', {
            userExists: !!dbUser,
            role: dbUser?.role,
          });
          throw new Error('Access denied: Admin privileges required');
        }

        console.log('✅ Admin session created:', {
          id: user.id,
          role: dbUser.role,
        });
        session.user.id = user.id;
        session.user.role = dbUser.role as typeof session.user.role;
      }
      return session;
    },
    redirect: async ({ url, baseUrl }) => {
      console.log('🔀 Backoffice auth redirect:', { url, baseUrl });
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`;
        console.log('✅ Redirecting to relative URL:', finalUrl);
        return finalUrl;
      }
      if (new URL(url).origin === baseUrl) {
        console.log('✅ Redirecting to same origin URL:', url);
        return url;
      }
      const dashboardUrl = `${baseUrl}/dashboard`;
      console.log('✅ Redirecting to dashboard:', dashboardUrl);
      return dashboardUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
};
