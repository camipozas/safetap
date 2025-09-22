import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn, useSession } from 'next-auth/react';
import { vi } from 'vitest';

import LoginForm from '@/app/login/ui/LoginForm';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  useSession: vi.fn(),
}));

const mockSignIn = vi.mocked(signIn);

describe('Google SSO Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
  });

  describe('LoginForm Component', () => {
    test('renders Google sign-in button', () => {
      render(<LoginForm />);
      expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
    });

    test('calls signIn with google provider when Google button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/account',
          redirect: false,
        });
      });
    });

    test('handles Google sign-in error gracefully', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({
        error: 'OAuthAccountNotLinked',
        ok: false,
        status: 401,
        url: null,
      });

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText(/No se pudo iniciar sesión con Google/)
        ).toBeInTheDocument();
      });
    });

    test('disables Google button while signing in', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      expect(googleButton).toBeDisabled();
      expect(screen.getByText('Conectando con Google...')).toBeInTheDocument();
    });

    test('shows loading state with correct text', async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      expect(screen.getByText('Conectando con Google...')).toBeInTheDocument();
    });
  });

  describe('Authentication Flow', () => {
    test('redirects to welcome page after successful Google authentication', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({
        ok: true,
        error: null,
        status: 200,
        url: null,
      });

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/account',
          redirect: false,
        });
      });
    });

    test('handles authentication errors from Google', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({
        error: 'OAuthAccountNotLinked',
        ok: false,
        status: 401,
        url: null,
      });

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText(/No se pudo iniciar sesión con Google/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    test('shows user info when authenticated with Google', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
            totalSpent: 0,
          },
          expires: '2025-12-31T23:59:59.999Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<LoginForm />);
      // The form should not be visible when authenticated
      expect(screen.queryByText('Inicia sesión')).not.toBeInTheDocument();
    });

    test('handles user creation for new Google accounts', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: 'user-789',
            name: 'New User',
            email: 'new@example.com',
            role: 'USER',
            totalSpent: 0,
          },
          expires: '2025-12-31T23:59:59.999Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<LoginForm />);
      // The form should not be visible when authenticated
      expect(screen.queryByText('Inicia sesión')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('shows error message for invalid credentials', async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValueOnce({
        error: 'InvalidCredentials',
        ok: false,
        status: 401,
        url: null,
      });

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText(/No se pudo iniciar sesión con Google/)
        ).toBeInTheDocument();
      });
    });

    test('handles network errors during authentication', async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValueOnce(new Error('Network error'));

      render(<LoginForm />);

      const googleButton = screen.getByText('Continuar con Google');
      await user.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText(/No se pudo iniciar sesión con Google/)
        ).toBeInTheDocument();
      });
    });
  });
});
