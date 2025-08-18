# SafeTap Backoffice Tests 🧪

Comprehensive test suite for the SafeTap administrative dashboard (backoffice).

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Test Commands](#test-commands)
- [Technologies](#technologies)
- [Configuration](#configuration)
- [Test Types](#test-types)
- [Clean Code Testing Conventions](#clean-code-testing-conventions)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [Coverage Targets](#coverage-targets)
- [CI/CD Integration](#cicd-integration)

## 📁 Test Structure

```
test/
├── setup.ts                           # Global test configuration
├── README.md                          # This documentation
├── components/                        # React component tests
│   ├── orders-table.test.tsx         # Order table component
│   ├── users-table.test.tsx          # User table component
│   └── confirmation-modal.test.tsx   # Confirmation modal
├── api/                              # API route tests
│   ├── orders.test.ts                # Order management API
│   └── invitations.test.ts           # Invitation system API
├── utils/                            # Utility function tests
│   └── utils.test.ts                 # Helper functions
├── pages/                            # Page component tests
│   ├── orders.test.tsx               # Orders page
│   ├── settings.test.tsx             # Settings page
│   └── signin.test.tsx               # Sign-in page
├── integration/                      # Integration tests
│   └── orders-workflow.test.tsx      # Complete order workflow
└── lib/                              # Library tests
    └── email.test.ts                 # Email functionality
```

## 🚀 Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test suites
npm test -- orders
npm test -- components
npm test -- api

# Run all quality checks (includes tests)
npm run check-all
```

## 🛠️ Technologies

- **Vitest**: Fast testing framework compatible with Vite
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Additional DOM testing matchers
- **jsdom**: Simulated DOM environment for Node.js

## ⚙️ Configuration

### setup.ts

Global test configuration includes:

- Jest DOM matcher configuration
- Next.js mocks (router, navigation)
- NextAuth session mocks
- Prisma client mocks
- Environment variables for testing

### vitest.config.ts

Vitest configuration with:

- React plugin support
- jsdom environment
- Path aliases (@)
- Setup files
- Coverage configuration

## 📊 Test Types

### 1. Component Tests

Test React components in isolation:

- **Rendering**: Component renders correctly
- **Interactions**: User interactions work as expected
- **Props**: Component responds to different props
- **State**: Internal state management
- **Callbacks**: Event handlers and callbacks

**Example:**

```typescript
describe('OrdersTable', () => {
  it('should render orders correctly', () => {
    const mockOrders = [
      {
        id: '1',
        status: 'PENDING',
        owner: { name: 'John Doe', email: 'john@example.com' },
        createdAt: new Date('2024-01-01')
      }
    ];

    render(<OrdersTable orders={mockOrders} onStatusChange={vi.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should call onStatusChange when status is updated', async () => {
    const mockOnStatusChange = vi.fn();
    const mockOrders = [/* ... */];

    render(<OrdersTable orders={mockOrders} onStatusChange={mockOnStatusChange} />);

    const statusSelect = screen.getByRole('combobox');
    await user.selectOptions(statusSelect, 'PAID');

    expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'PAID');
  });
});
```

### 2. API Route Tests

Test Next.js API routes:

- **Request/Response**: Proper HTTP handling
- **Data Validation**: Input validation with Zod
- **Error Handling**: Appropriate error responses
- **Authentication**: Protected routes
- **Authorization**: Role-based access

**Example:**

```typescript
describe('API Route: /api/admin/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update order status successfully', async () => {
    const mockSession = {
      user: { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' },
    };

    mockGetServerSession.mockResolvedValue(mockSession);
    mockPrisma.sticker.update.mockResolvedValue({
      id: 'order-1',
      status: 'PAID',
    });

    const request = new NextRequest(
      'http://localhost/api/admin/orders/order-1',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' }),
      }
    );

    const response = await PUT(request, { params: { id: 'order-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('PAID');
    expect(mockPrisma.sticker.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'PAID' },
    });
  });

  it('should return 401 for unauthorized users', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost/api/admin/orders/order-1',
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' }),
      }
    );

    const response = await PUT(request, { params: { id: 'order-1' } });

    expect(response.status).toBe(401);
  });
});
```

### 3. Utility Tests

Test helper functions and utilities:

- **Data Formatting**: Date, currency, text formatting
- **Calculations**: Business logic calculations
- **Validations**: Data validation functions
- **Transformations**: Data transformations

### 4. Page Tests

Test complete page components:

- **Layout Rendering**: Page structure and layout
- **Data Loading**: Initial data fetching
- **Component Integration**: Multiple components working together
- **User Flows**: Common user interactions

### 5. Integration Tests

Test complete workflows:

- **Order Management**: Complete order processing workflow
- **User Management**: User creation and modification flows
- **Authentication**: Login and session management
- **Data Synchronization**: Real-time updates

## 📐 Clean Code Testing Conventions

### 🏗️ Test Structure Standards

#### Follow AAA Pattern

```typescript
// ✅ Arrange, Act, Assert pattern
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      };
      const mockUser = { id: '1', ...userData };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });
});
```

#### Descriptive Test Names

```typescript
// ✅ Clear, descriptive test names
describe('OrdersTable Component', () => {
  it('should display orders in table format');
  it('should highlight overdue orders in red');
  it('should allow status change for authorized users');
  it('should show confirmation modal before status change');
  it('should handle empty orders list gracefully');
  it('should display loading state while fetching orders');
  it('should show error message when orders fail to load');
});

// ❌ Vague test names
describe('OrdersTable', () => {
  it('works correctly');
  it('handles data');
  it('shows stuff');
});
```

### 🎯 Test Data Management

#### Test Data Builders

```typescript
// ✅ Reusable test data builders
export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'default-order-id',
  status: 'PENDING',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  owner: {
    id: 'default-user-id',
    name: 'Test User',
    email: 'test@example.com',
  },
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'default-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

// Usage in tests
const pendingOrder = createMockOrder({ status: 'PENDING' });
const adminUser = createMockUser({ role: 'ADMIN' });
```

#### Factories for Complex Data

```typescript
// ✅ Factory functions for complex scenarios
export class TestDataFactory {
  static createOrderWithItems(itemCount: number = 3): Order {
    return createMockOrder({
      items: Array.from({ length: itemCount }, (_, i) => ({
        id: `item-${i}`,
        name: `Test Item ${i + 1}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: Math.floor(Math.random() * 10000) + 1000,
      })),
    });
  }

  static createUserWithProfiles(profileCount: number = 2): User {
    return createMockUser({
      profiles: Array.from({ length: profileCount }, (_, i) => ({
        id: `profile-${i}`,
        name: `Profile ${i + 1}`,
        isActive: i === 0, // First profile is active
      })),
    });
  }
}
```

### 🎨 Component Testing Patterns

#### Custom Render with Providers

```typescript
// ✅ Custom render function with necessary providers
interface RenderOptions {
  session?: Session | null;
  initialState?: Partial<AppState>;
}

export function renderWithProviders(
  component: React.ReactElement,
  options: RenderOptions = {}
) {
  const { session = mockAdminSession, initialState = {} } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={session}>
      <QueryClientProvider client={createTestQueryClient()}>
        <AppStateProvider initialState={initialState}>
          {children}
        </AppStateProvider>
      </QueryClientProvider>
    </SessionProvider>
  );

  return render(component, { wrapper: Wrapper });
}

// Usage
renderWithProviders(
  <OrdersTable orders={mockOrders} />,
  { session: mockAdminSession }
);
```

#### Testing User Interactions

```typescript
// ✅ Comprehensive user interaction testing
describe('Order Status Change', () => {
  it('should update order status through dropdown', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();

    renderWithProviders(
      <OrdersTable orders={[mockOrder]} onStatusChange={mockOnStatusChange} />
    );

    // Find and interact with status dropdown
    const statusDropdown = screen.getByRole('combobox', {
      name: /order status/i
    });

    // Open dropdown
    await user.click(statusDropdown);

    // Select new status
    const paidOption = screen.getByRole('option', { name: /paid/i });
    await user.click(paidOption);

    // Verify callback was called
    expect(mockOnStatusChange).toHaveBeenCalledWith(mockOrder.id, 'PAID');
  });
});
```

### 🧪 Testing Async Operations

#### API Call Testing

```typescript
// ✅ Testing async operations with proper error handling
describe('useOrders Hook', () => {
  it('should fetch orders successfully', async () => {
    const mockOrders = [createMockOrder(), createMockOrder()];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        orders: mockOrders,
        totalCount: mockOrders.length
      })
    });

    const { result } = renderHook(() => useOrders(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>
          {children}
        </QueryClientProvider>
      )
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toEqual(new Error('API Error'));
  });
});
```

## 🎭 Mocking Strategies

### Next.js Mocks

```typescript
// ✅ Next.js router and navigation mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/dashboard/orders',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
```

### NextAuth Mocks

```typescript
// ✅ NextAuth session mocks
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
```

### Prisma Mocks

```typescript
// ✅ Prisma client mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sticker: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));
```

### Fetch API Mocks

```typescript
// ✅ Global fetch mocks
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// In test
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true, data: mockData }),
});
```

## ✅ Best Practices

### Do's ✅

1. **Write descriptive test names** that explain the expected behavior
2. **Test behavior, not implementation** - focus on what the component does
3. **Use `screen.getBy*`** for elements that must exist
4. **Use `screen.queryBy*`** for elements that might not exist
5. **Clean up mocks** between tests with `beforeEach` and `afterEach`
6. **Test edge cases** and error scenarios
7. **Use proper accessibility queries** (getByRole, getByLabelText)
8. **Test user interactions** with userEvent library
9. **Mock external dependencies** appropriately
10. **Keep tests focused** - one concept per test

### Don'ts ❌

1. **Don't test implementation details** - avoid testing internal state directly
2. **Don't over-mock** - only mock what's necessary
3. **Don't write tests just for coverage** - ensure tests add value
4. **Don't couple tests** - each test should be independent
5. **Don't use brittle selectors** - avoid testing specific DOM structure
6. **Don't ignore accessibility** - use proper ARIA queries
7. **Don't forget error cases** - test unhappy paths
8. **Don't leave unused mocks** - clean up what you don't need

### Example of Good vs Bad Testing

```typescript
// ❌ Bad - Testing implementation details
it('should set loading state to true', () => {
  const { result } = renderHook(() => useOrders());
  expect(result.current.loading).toBe(true);
});

// ✅ Good - Testing behavior
it('should show loading indicator while fetching orders', () => {
  renderWithProviders(<OrdersPage />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

// ❌ Bad - Brittle selector
it('should render table', () => {
  render(<OrdersTable orders={[]} />);
  expect(document.querySelector('.table-container .data-table')).toBeInTheDocument();
});

// ✅ Good - Semantic query
it('should render orders table', () => {
  render(<OrdersTable orders={[]} />);
  expect(screen.getByRole('table', { name: /orders/i })).toBeInTheDocument();
});
```

## 📊 Coverage Targets

- **Components**: >90% - Critical UI elements must be thoroughly tested
- **API Routes**: >95% - Business logic and data handling
- **Utilities**: >95% - Pure functions should be easy to test completely
- **Integration**: Cover critical user flows and business processes

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
npm test -- --coverage --reporter=html
open coverage/index.html
```

## 🚀 CI/CD Integration

Tests run automatically on:

- **Pull Requests**: All tests must pass before merging
- **Push to main**: Regression testing
- **Pre-deployment**: Quality gate before production deployment

### CI Command

```bash
# Command used in CI pipeline
npm run check-all  # Includes: type-check + lint + format + test
```

### Quality Gates

- All tests must pass (100% pass rate)
- Coverage thresholds must be met
- No TypeScript errors
- No linting errors
- Code must be properly formatted

---

Made with ❤️ by the SafeTap team
