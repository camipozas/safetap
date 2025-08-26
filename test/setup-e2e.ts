import { beforeAll, beforeEach } from 'vitest';
import './mocks/prisma';

beforeAll(() => {
  const mockRouter = {
    push: () => Promise.resolve(),
    replace: () => Promise.resolve(),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => Promise.resolve(),
  };

  const mockParams = {
    get: () => null,
    getAll: () => [],
    has: () => false,
    entries: () => [][Symbol.iterator](),
    forEach: () => {},
    keys: () => [][Symbol.iterator](),
    values: () => [][Symbol.iterator](),
    append: () => {},
    delete: () => {},
    set: () => {},
    sort: () => {},
    toString: () => '',
    size: 0,
    [Symbol.iterator]: () => [][Symbol.iterator](),
  };

  vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => mockParams,
    usePathname: () => '/',
    redirect: vi.fn(),
    notFound: vi.fn(),
  }));

  vi.mock('next/headers', () => ({
    headers: () => new Map(),
    cookies: () => ({
      get: () => undefined,
      set: () => {},
      delete: () => {},
    }),
  }));

  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
  });
  Object.defineProperty(process.env, 'NEXTAUTH_URL', {
    value: 'http://localhost:3000',
    writable: true,
  });
  Object.defineProperty(process.env, 'NEXTAUTH_SECRET', {
    value: 'test-secret',
    writable: true,
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
