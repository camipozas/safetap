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
  return base.$extends(withAccelerate()) as unknown as PrismaClient;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? newClient();

if (!environment.app.isProduction) {
  globalForPrisma.prisma = prisma;
}

// Best-effort ping so the first request doesn't pay cold start/connection
void prisma.$executeRawUnsafe('SELECT 1').catch(() => {});
