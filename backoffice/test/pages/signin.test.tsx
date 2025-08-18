import SignInPage from '@/app/auth/signin/page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('Backoffice SignIn Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in page with Google authentication', () => {
    render(<SignInPage />);

    expect(screen.getByText('SafeTap Admin Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Accede al panel de administración')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /iniciar sesión con google/i })
    ).toBeInTheDocument();
  });

  it('shows admin features information', () => {
    render(<SignInPage />);

    expect(screen.getByText('Gestión de usuarios')).toBeInTheDocument();
    expect(screen.getByText('Analytics y reportes')).toBeInTheDocument();
  });

  it('calls signIn with correct parameters when Google button is clicked', async () => {
    const mockSignIn = vi.mocked(signIn);
    render(<SignInPage />);

    const googleButton = screen.getByRole('button', {
      name: /iniciar sesión con google/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
      });
    });
  });

  it('shows admin permission notice', () => {
    render(<SignInPage />);

    expect(
      screen.getByText(
        'Solo usuarios con permisos de administrador pueden acceder'
      )
    ).toBeInTheDocument();
  });

  it('handles Google sign-in errors gracefully', async () => {
    const mockSignIn = vi
      .mocked(signIn)
      .mockRejectedValue(new Error('Access denied: Admin privileges required'));

    render(<SignInPage />);

    const googleButton = screen.getByRole('button', {
      name: /iniciar sesión con google/i,
    });
    fireEvent.click(googleButton);

    // The error should be handled by NextAuth and not crash the component
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
      // Page should still be rendered
      expect(screen.getByText('SafeTap Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('displays the SafeTap branding correctly', () => {
    render(<SignInPage />);

    expect(screen.getByText('SafeTap Admin Dashboard')).toBeInTheDocument();
    // Check for the shield icon by looking for the SVG element
    const shieldIcon = document.querySelector('svg');
    expect(shieldIcon).toBeInTheDocument();
  });

  it('renders admin features with correct icons', () => {
    render(<SignInPage />);

    // Check for users management feature
    expect(screen.getByText('Gestión de usuarios')).toBeInTheDocument();

    // Check for analytics feature
    expect(screen.getByText('Analytics y reportes')).toBeInTheDocument();
  });

  it('has proper styling and layout structure', () => {
    render(<SignInPage />);

    // Check for proper container structure
    const container = screen
      .getByText('SafeTap Admin Dashboard')
      .closest('div');
    expect(container).toBeInTheDocument();

    // Check that Google button exists and is properly styled
    const googleButton = screen.getByRole('button', {
      name: /iniciar sesión con google/i,
    });
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveClass('w-full');
  });
});
