import { type PrismaClient } from '@prisma/client';
import { type Adapter } from 'next-auth/adapters';

/**
 * Custom Prisma adapter for NextAuth that works with our existing schema
 * where relations use capitalized names (User, Account) instead of lowercase
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    createUser: async (data) => {
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: data.email!,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
          updatedAt: new Date(),
        },
      });
      return user;
    },

    getUser: async (id) => {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user;
    },

    getUserByEmail: async (email) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    },

    getUserByAccount: async ({ providerAccountId, provider }) => {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { User: true },
      });
      return account?.User ?? null;
    },

    updateUser: async ({ id, ...data }) => {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      return user;
    },

    deleteUser: async (userId) => {
      await prisma.user.delete({
        where: { id: userId },
      });
    },

    linkAccount: async (data) => {
      const account = await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      });
      return account;
    },

    unlinkAccount: async ({ providerAccountId, provider }) => {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },

    createSession: async ({ sessionToken, userId, expires }) => {
      const session = await prisma.session.create({
        data: {
          id: crypto.randomUUID(),
          sessionToken,
          userId,
          expires,
        },
      });
      return session;
    },

    getSessionAndUser: async (sessionToken) => {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { User: true },
      });
      if (!userAndSession) {
        return null;
      }
      const { User: user, ...session } = userAndSession;
      return { user, session };
    },

    updateSession: async ({ sessionToken, ...data }) => {
      const session = await prisma.session.update({
        where: { sessionToken },
        data,
      });
      return session;
    },

    deleteSession: async (sessionToken) => {
      await prisma.session.delete({
        where: { sessionToken },
      });
    },

    createVerificationToken: async ({ identifier, expires, token }) => {
      const verificationToken = await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          identifier,
          token,
          expires,
        },
      });
      // Remove the id field to match NextAuth's expected format
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...result } = verificationToken;
      return result;
    },

    useVerificationToken: async ({ identifier, token }) => {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        // Remove the id field to match NextAuth's expected format
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...result } = verificationToken;
        return result;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // If token already used/deleted, return null
        return null;
      }
    },
  };
}
