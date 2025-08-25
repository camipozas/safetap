import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

import { environment } from '@/environment/config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function newClient(): PrismaClient {
  const base = new PrismaClient({
    datasourceUrl: environment.database.url,
    log: environment.app.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });

  // Don't use Accelerate in test environment
  if (process.env.NODE_ENV === 'test') {
    return base as unknown as PrismaClient;
  }

  // Only use Accelerate in production or when using a compatible URL
  const isAccelerateUrl =
    environment.database.url?.startsWith('prisma://') ||
    environment.database.url?.startsWith('prisma+postgres://');

  if (environment.app.isProduction && isAccelerateUrl) {
    return base.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return base as unknown as PrismaClient;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? newClient();

if (!environment.app.isProduction) {
  globalForPrisma.prisma = prisma;
}

// Best-effort ping so the first request doesn't pay cold start/connection
// Skip in test environment to avoid connection issues
if (process.env.NODE_ENV !== 'test') {
  void prisma.$executeRawUnsafe('SELECT 1').catch(() => {});
}
