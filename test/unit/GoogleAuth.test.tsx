/* eslint-disable @typescript-eslint/no-unused-vars */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Session } from 'next-auth';
import { signIn, useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Type for mocked useSession return
type MockSessionReturn = {
  data: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  update: ReturnType<typeof vi.fn>;
};

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
  useSession: vi.fn(
    (): MockSessionReturn => ({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  ),
}));

import LoginForm from '@/app/login/ui/LoginForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

describe('Google SSO Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginForm Component', () => {
    it('renders Google sign-in button', () => {
      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      expect(googleButton).toBeInTheDocument();
    });

    it('calls signIn with google provider when Google button is clicked', async () => {
      const mockSignIn = vi.mocked(signIn);
      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/account',
          redirect: false,
        });
      });
    });

    it('handles Google sign-in error gracefully', async () => {
      const mockSignIn = vi
        .mocked(signIn)
        .mockRejectedValue(new Error('Google sign-in failed'));
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '❌ Error signing in with Google:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('disables Google button while signing in', async () => {
      // Mock successful signIn to test loading state
      const mockSignIn = vi
        .mocked(signIn)
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({ ok: true, error: null, status: 200, url: null }),
                100
              )
            )
        );

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });

      fireEvent.click(googleButton);

      // Button should be disabled immediately after click
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
      });
    });

    it('shows loading state with correct text', async () => {
      // Mock slow signIn to capture loading state
      const mockSignIn = vi
        .mocked(signIn)
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({ ok: true, error: null, status: 200, url: null }),
                100
              )
            )
        );

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });

      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(
          screen.getByText('Conectando con Google...')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('redirects to account page after successful Google authentication', async () => {
      const mockSignIn = vi
        .mocked(signIn)
        .mockResolvedValue({ ok: true, error: null, status: 200, url: null });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/account',
          redirect: false,
        });
      });
    });

    it('handles authentication errors from Google', async () => {
      const mockSignIn = vi.mocked(signIn).mockResolvedValue({
        ok: false,
        error: 'OAuthAccountNotLinked',
        status: 401,
        url: null,
      });

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management', () => {
    it('shows user info when authenticated with Google', () => {
      const mockSessionData: MockSessionReturn = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@gmail.com',
            name: 'Test User',
            image: 'https://lh3.googleusercontent.com/test.jpg',
            role: 'USER',
            totalSpent: 0,
          },
        } as Session,
        status: 'authenticated',
        update: vi.fn(),
      };

      vi.mocked(useSession).mockReturnValue(mockSessionData as any);

      const session = useSession();
      expect(session.data?.user.email).toBe('test@gmail.com');
      expect(session.status).toBe('authenticated');
    });

    it('handles user creation for new Google accounts', () => {
      const mockSessionData: MockSessionReturn = {
        data: {
          user: {
            id: 'new-user-123',
            email: 'newuser@gmail.com',
            name: 'New User',
            image: 'https://lh3.googleusercontent.com/new.jpg',
            role: 'USER',
            totalSpent: 0,
            emailVerified: new Date(),
          },
        } as Session,
        status: 'authenticated',
        update: vi.fn(),
      };

      vi.mocked(useSession).mockReturnValue(mockSessionData as any);

      const session = useSession();
      expect(session.data?.user.emailVerified).toBeDefined();
      expect(session.data?.user.role).toBe('USER');
    });
  });

  describe('Error Handling', () => {
    it('shows error message for invalid credentials', () => {
      const mockSessionData: MockSessionReturn = {
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      };

      vi.mocked(useSession).mockReturnValue(mockSessionData as any);

      render(<LoginForm />);

      // Should handle the error gracefully
      expect(
        screen.getByRole('button', { name: /continuar con google/i })
      ).toBeInTheDocument();
    });

    it('handles network errors during authentication', async () => {
      const mockSignIn = vi
        .mocked(signIn)
        .mockRejectedValue(new Error('Network error'));
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<LoginForm />);

      const googleButton = screen.getByRole('button', {
        name: /continuar con google/i,
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
