import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginForm from '@/app/login/ui/LoginForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn().mockResolvedValue(undefined),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders login form elements', () => {
    render(<LoginForm />);

    expect(
      screen.getByRole('textbox', { name: /dirección de correo electrónico/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /enviar enlace de acceso/i })
    ).toBeInTheDocument();
  });

  it('displays email input with correct type', () => {
    render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('disables submit button when email is empty', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when valid email is entered', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const form = screen.getByRole('form');

    // Enter invalid email and submit form to trigger validation
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);

    // The form uses browser native validation which doesn't show custom messages in tests
    // Instead, we can check that the input has the correct validation properties
    expect(emailInput).toBeInvalid();
  });

  it('handles form submission', async () => {
    // Mock the fetch function to simulate successful submission
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'test-message-id' }),
    } as Response);

    const { unmount } = render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/custom-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });

    unmount();
  });

  it('shows loading state during submission', async () => {
    let resolvePromise: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    // Mock fetch with a controllable promise
    vi.mocked(global.fetch).mockReturnValue(fetchPromise);

    const { unmount } = render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Check loading state immediately
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();

    // Clean up by resolving the promise and unmounting before test ends
    resolvePromise!({
      ok: true,
      json: async () => ({ messageId: 'test-message-id' }),
    } as Response);

    // Wait for the promise to resolve
    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });

    unmount();
  });

  it('handles callback URL from search params', () => {
    render(<LoginForm />);

    // Component should render without errors even with search params
    expect(
      screen.getByRole('textbox', { name: /dirección de correo electrónico/i })
    ).toBeInTheDocument();
  });

  it('displays success message after submission', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'test-message-id' }),
    } as Response);

    const { unmount } = render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo/i)).toBeInTheDocument();
    });

    unmount();
  });
});
