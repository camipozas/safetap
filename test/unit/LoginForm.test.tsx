import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import LoginForm from '@/app/login/ui/LoginForm';

// Mock fetch
global.fetch = vi.fn();

const mockFetch = vi.mocked(global.fetch);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form elements', () => {
    render(<LoginForm />);

    expect(
      screen.getByLabelText('Dirección de correo electrónico')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Enviar enlace de acceso' })
    ).toBeInTheDocument();
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
  });

  test('displays email input with correct type', () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'tu@email.com');
  });

  test('disables submit button when email is empty', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when valid email is entered', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'test@example.com');

    expect(submitButton).toBeEnabled();
  });

  test('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(
      screen.getByText('Dirección de correo electrónico')
    ).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email sent successfully' }),
    } as Response);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/custom-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          callbackUrl: '/welcome?cta=sticker',
        }),
      });
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('displays success message after submission', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email sent successfully' }),
    } as Response);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
      expect(
        screen.getByText(/Hemos enviado un enlace de acceso a/)
      ).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  test('handles callback URL from search params', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Email sent successfully' }),
    } as Response);

    render(<LoginForm callbackUrl="/custom-callback" />);

    const emailInput = screen.getByLabelText('Dirección de correo electrónico');
    const submitButton = screen.getByRole('button', {
      name: 'Enviar enlace de acceso',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/custom-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          callbackUrl: '/custom-callback',
        }),
      });
    });
  });
});
