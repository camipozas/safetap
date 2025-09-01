import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Navigation from '@/components/Navigation';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null })),
}));

describe('Navigation', () => {
  it('renders all navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('Guía de uso')).toBeInTheDocument();
    expect(screen.getByText('Comprar')).toBeInTheDocument();
  });

  it('has correct link attributes', () => {
    render(<Navigation />);

    const guideLink = screen.getByText('Guía de uso');
    expect(guideLink.closest('a')).toHaveAttribute('href', '/guide');

    const buyLink = screen.getByText('Comprar');
    expect(buyLink.closest('a')).toHaveAttribute('href', '/buy');
  });

  it('shows "Iniciar sesión" when user is not authenticated', () => {
    render(<Navigation />);

    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.queryByText('Mi cuenta')).not.toBeInTheDocument();

    const loginLink = screen.getByText('Iniciar sesión');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('shows "Mi cuenta" when user is authenticated', async () => {
    const { useSession } = await import('next-auth/react');
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'test-id',
          email: 'test@example.com',
          role: 'USER' as const,
          totalSpent: 0,
        },
        expires: '2025-12-31T23:59:59.999Z',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<Navigation />);

    expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
    expect(screen.queryByText('Iniciar sesión')).not.toBeInTheDocument();

    const accountLink = screen.getByText('Mi cuenta');
    expect(accountLink.closest('a')).toHaveAttribute('href', '/account');
  });
});
