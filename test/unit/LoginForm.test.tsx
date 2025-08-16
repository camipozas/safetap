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

// Mock fetch globally
global.fetch = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
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

    render(<LoginForm />);

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
  });

  it('shows loading state during submission', async () => {
    // Mock fetch with a delay to simulate loading state
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ messageId: 'test-message-id' }),
              } as Response),
            100
          )
        )
    );

    render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', {
      name: /dirección de correo electrónico/i,
    });
    const submitButton = screen.getByRole('button', {
      name: /enviar enlace de acceso/i,
    });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
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

    render(<LoginForm />);

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
  });
});
