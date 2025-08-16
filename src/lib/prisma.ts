import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Cache prisma across hot reloads in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function newClient(): PrismaClient {
  const base = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
  // Extend with Accelerate at runtime; cast back to PrismaClient for typing of model APIs
  return base.$extends(withAccelerate()) as unknown as PrismaClient;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? newClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Best-effort ping so the first request doesn't pay cold start/connection
void prisma.$executeRawUnsafe('SELECT 1').catch(() => {});
