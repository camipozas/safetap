import DashboardLayout from '@/app/dashboard/layout';
import { prisma } from '@/lib/prisma';
import { fireEvent, render, screen } from '@testing-library/react';
import { getServerSession } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment config
vi.mock('@/environment/config', () => ({
  environment: {
    app: {
      environment: 'test',
      isProduction: false,
      isDevelopment: false,
    },
  },
}));

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  usePathname: vi.fn(() => '/dashboard'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/types/shared', () => ({
  hasPermission: vi.fn(() => true),
}));

// Mock the Sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  default: ({
    isOpen,
    onToggle,
  }: {
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <div data-testid="sidebar" data-open={isOpen}>
      <button onClick={onToggle} data-testid="sidebar-toggle">
        Toggle
      </button>
    </div>
  ),
  MobileHeader: ({ onToggle }: { onToggle: () => void }) => (
    <div data-testid="mobile-header">
      <button onClick={onToggle} data-testid="mobile-toggle">
        Mobile Toggle
      </button>
    </div>
  ),
}));

const mockSession = {
  user: {
    email: 'admin@test.com',
    role: 'ADMIN' as const,
  },
};

const mockUser = {
  id: '1',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
  name: 'Admin User',
  image: null,
  country: null,
  emailVerified: null,
  totalSpent: 0,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DashboardLayout Responsive Behavior', () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    // Mock NODE_ENV for development mode
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('should render mobile header for responsive design', async () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should show development banner in development mode', async () => {
    const TestChild = () => <div>Test</div>;

    render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    expect(screen.getByText(/Modo Desarrollo/)).toBeInTheDocument();
  });
});

describe('ClientLayout Component', () => {
  // We'll test the client component functionality through the development mode
  it('should toggle sidebar when mobile toggle is clicked', async () => {
    const TestChild = () => <div>Test</div>;

    render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    const mobileToggle = screen.getByTestId('mobile-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Initially sidebar should be closed
    expect(sidebar).toHaveAttribute('data-open', 'false');

    // Click mobile toggle
    fireEvent.click(mobileToggle);

    // Sidebar should be open
    expect(sidebar).toHaveAttribute('data-open', 'true');

    // Click again to close
    fireEvent.click(mobileToggle);

    // Sidebar should be closed
    expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  it('should toggle sidebar when sidebar toggle is clicked', async () => {
    const TestChild = () => <div>Test</div>;

    render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    const sidebarToggle = screen.getByTestId('sidebar-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Initially sidebar should be closed
    expect(sidebar).toHaveAttribute('data-open', 'false');

    // Click sidebar toggle
    fireEvent.click(sidebarToggle);

    // Sidebar should be open
    expect(sidebar).toHaveAttribute('data-open', 'true');
  });

  it('should have proper responsive layout structure', async () => {
    const TestChild = () => <div data-testid="child-content">Child</div>;

    const { container } = render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    // Check for mobile-first responsive structure
    expect(
      container.querySelector('.min-h-screen.bg-gray-50')
    ).toBeInTheDocument();
    expect(container.querySelector('.flex')).toBeInTheDocument();
    expect(container.querySelector('.flex-1')).toBeInTheDocument();
    expect(container.querySelector('.max-w-7xl.mx-auto')).toBeInTheDocument();
  });

  it('should have proper content padding for mobile and desktop', async () => {
    const TestChild = () => <div>Content</div>;

    const { container } = render(
      await DashboardLayout({
        children: <TestChild />,
      })
    );

    // Check for responsive padding classes
    const contentWrapper = container.querySelector('.p-4.lg\\:p-8');
    expect(contentWrapper).toBeInTheDocument();
  });
});
