import Sidebar, { MobileHeader } from '@/components/ui/sidebar';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3001',
  },
  writable: true,
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
  });

  it('should render sidebar with navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('SafeTap Admin')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Órdenes')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard/orders');

    render(<Sidebar />);

    const ordersLink = screen.getByText('Órdenes').closest('a');
    expect(ordersLink).toHaveClass('bg-safetap-100', 'text-safetap-900');
  });

  it('should show mobile overlay when open on mobile', () => {
    const { container } = render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    const overlay = container.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    );
    expect(overlay).toBeInTheDocument();
  });

  it('should call onToggle when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();

    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    // Find the close button (X icon) - should be the first button
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; // The close button should be the first one
    await user.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when navigation link is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();

    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const dashboardLink = screen.getByText('Dashboard');
    await user.click(dashboardLink);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should handle sign out when logout button is clicked', async () => {
    render(<Sidebar />);

    const logoutButton = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutButton);

    expect(signOut).toHaveBeenCalledWith({
      callbackUrl: 'http://localhost:3001/auth/signin',
    });
  });

  it('should be hidden by default on mobile when isOpen is false', () => {
    render(<Sidebar isOpen={false} />);

    const sidebar = screen.getByTestId('sidebar-container');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('should be visible on mobile when isOpen is true', () => {
    render(<Sidebar isOpen={true} />);

    const sidebar = screen.getByTestId('sidebar-container');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('should show mobile close button when open', () => {
    const mockOnToggle = vi.fn();
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('should call onToggle when navigation link is clicked on mobile', () => {
    const mockOnToggle = vi.fn();
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);

    expect(mockOnToggle).toHaveBeenCalled();
  });
});

describe('MobileHeader Component', () => {
  it('should render mobile header with toggle button', () => {
    const mockOnToggle = vi.fn();
    render(<MobileHeader onToggle={mockOnToggle} />);

    expect(screen.getByText('SafeTap Admin')).toBeInTheDocument();

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('should call onToggle when menu button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();

    render(<MobileHeader onToggle={mockOnToggle} />);

    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should have mobile-specific classes', () => {
    const mockOnToggle = vi.fn();
    const { container } = render(<MobileHeader onToggle={mockOnToggle} />);

    const header = container.querySelector('.lg\\:hidden');
    expect(header).toBeInTheDocument();
  });

  it('should have proper mobile styling classes', () => {
    const mockOnToggle = vi.fn();
    const { container } = render(<MobileHeader onToggle={mockOnToggle} />);

    const header = container.querySelector('.lg\\:hidden');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('lg:hidden');
  });
});

describe('Sidebar Responsive Behavior', () => {
  it('should show overlay when open on mobile', () => {
    render(<Sidebar isOpen={true} onToggle={vi.fn()} />);

    // Check for overlay element
    const overlayElement = document.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    );
    expect(overlayElement).toBeInTheDocument();
  });

  it('should not show overlay when closed on mobile', () => {
    render(<Sidebar isOpen={false} onToggle={vi.fn()} />);

    // Check for overlay element
    const overlayElement = document.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    );
    expect(overlayElement).not.toBeInTheDocument();
  });

  it('should close sidebar when overlay is clicked', () => {
    const mockOnToggle = vi.fn();
    render(<Sidebar isOpen={true} onToggle={mockOnToggle} />);

    const overlay = document.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    ) as HTMLElement;
    fireEvent.click(overlay);

    expect(mockOnToggle).toHaveBeenCalled();
  });
});
