import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

vi.mock('next-auth', () => ({
  default: vi.fn().mockReturnValue(vi.fn()),
  getServerSession: vi.fn(),
}));

vi.mock('next-auth/providers/email', () => ({
  default: vi.fn().mockReturnValue({
    id: 'email',
    type: 'email',
    name: 'Email',
    server: expect.any(Object),
    from: expect.any(String),
    maxAge: expect.any(Number),
  }),
}));

vi.mock('./prisma', () => ({
  prisma: {},
}));

describe('Auth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.EMAIL_SERVER_HOST = 'smtp.test.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@example.com';
    process.env.EMAIL_SERVER_PASSWORD = 'password';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('exports authOptions configuration', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(authOptions).toBeDefined();
    expect(authOptions.session).toEqual({ strategy: 'database' });
  });

  it('configures email provider', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(authOptions.providers).toBeDefined();
    expect(authOptions.providers).toHaveLength(1);
    // Check that the provider has email type properties
    const provider = authOptions.providers[0] as { type: string };
    expect(provider).toHaveProperty('type', 'email');
  });

  it('sets up Prisma adapter', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(authOptions.adapter).toBeDefined();
  });

  it('configures session strategy as database', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(authOptions.session?.strategy).toBe('database');
  });

  it('has providers array', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(Array.isArray(authOptions.providers)).toBe(true);
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });

  it('exports auth function', async () => {
    const { auth } = await import('@/lib/auth');

    expect(auth).toBeDefined();
    expect(typeof auth).toBe('function');
  });

  it('exports default NextAuth instance', async () => {
    const authModule = await import('@/lib/auth');

    // The default export should be the NextAuth instance function
    expect(authModule.default).toBeDefined();
    expect(typeof authModule.default).toBe('function');
  });

  it('configures custom pages', async () => {
    const { authOptions } = await import('@/lib/auth');

    expect(authOptions.pages?.signIn).toBe('/login');
    expect(authOptions.pages?.error).toBe('/login');
  });
});
