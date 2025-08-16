import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create the mock constructor function
const mockPrismaClient = vi.fn().mockImplementation(() => ({
  $extends: vi.fn().mockReturnThis(),
  $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
}));

// Mock dependencies
vi.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaClient,
}));

vi.mock('@prisma/extension-accelerate', () => ({
  withAccelerate: vi.fn(),
}));

describe('Prisma Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the global cache
    const globalForPrisma = globalThis as { prisma?: unknown };
    delete globalForPrisma.prisma;
  });

  it('exports prisma client', async () => {
    const { prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('creates client with correct configuration', async () => {
    // Clear the module cache and mock
    vi.clearAllMocks();
    vi.resetModules();

    // Import the module which should trigger PrismaClient instantiation
    await import('@/lib/prisma');

    // Check that PrismaClient was instantiated (mock constructor was called)
    expect(mockPrismaClient).toHaveBeenCalled();
  });

  it('handles database operations', async () => {
    const { prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(prisma.$executeRawUnsafe).toBeDefined();
  });
});
