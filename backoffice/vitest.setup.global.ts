// Global setup for vitest
import { beforeAll } from 'vitest';

// Don't mock @/lib/utils - use the real implementation

beforeAll(() => {
  // Setup database environment variables for Prisma in tests
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
  process.env.DIRECT_URL = process.env.DIRECT_URL || 'file:./dev.db';

  // Setup any global state here if needed
});
