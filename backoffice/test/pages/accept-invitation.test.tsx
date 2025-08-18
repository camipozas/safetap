import AcceptInvitationPage from '@/app/auth/accept-invitation/page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

const mockSearchParams = {
  get: vi.fn(),
};

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('shows error when no token is provided', async () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(screen.getByText('Invitación No Válida')).toBeInTheDocument();
      expect(
        screen.getByText('Token de invitación no válido')
      ).toBeInTheDocument();
    });
  });

  it('shows loading state while validating invitation', () => {
    mockSearchParams.get.mockReturnValue('valid-token');

    render(<AcceptInvitationPage />);

    expect(screen.getByText('Validando invitación...')).toBeInTheDocument();
  });

  it('shows invitation details when token is valid', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          isValid: true,
          invitation: {
            email: 'test@example.com',
            role: 'ADMIN',
            expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
          },
        }),
    });

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Invitación de Administrador')
      ).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Rol: Administrador')).toBeInTheDocument();
      expect(screen.getByText('Aceptar Invitación')).toBeInTheDocument();
    });
  });

  it('shows Super Admin role correctly', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          isValid: true,
          invitation: {
            email: 'superadmin@example.com',
            role: 'SUPER_ADMIN',
            expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
          },
        }),
    });

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(screen.getByText('Rol: Super Administrador')).toBeInTheDocument();
    });
  });

  it('shows error when invitation is invalid', async () => {
    mockSearchParams.get.mockReturnValue('invalid-token');
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: 'Esta invitación ha expirado',
        }),
    });

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(screen.getByText('Invitación No Válida')).toBeInTheDocument();
      expect(
        screen.getByText('Esta invitación ha expirado')
      ).toBeInTheDocument();
    });
  });

  it('accepts invitation successfully', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');

    // First call for validation
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            isValid: true,
            invitation: {
              email: 'test@example.com',
              role: 'ADMIN',
              expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
            },
          }),
      })
      // Second call for accepting
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: 'Account created successfully',
          }),
      });

    render(<AcceptInvitationPage />);

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText('Aceptar Invitación')).toBeInTheDocument();
    });

    // Click accept button
    const acceptButton = screen.getByText('Aceptar Invitación');
    fireEvent.click(acceptButton);

    // Should show accepting state
    await waitFor(() => {
      expect(screen.getByText('Aceptando...')).toBeInTheDocument();
    });

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('¡Invitación Aceptada!')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Tu cuenta de administrador ha sido creada exitosamente.'
        )
      ).toBeInTheDocument();
    });

    // Should redirect after success
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/auth/signin?message=invitation_accepted'
        );
      },
      { timeout: 3000 }
    );
  });

  it('handles accept invitation error', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');

    // First call for validation
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            isValid: true,
            invitation: {
              email: 'test@example.com',
              role: 'ADMIN',
              expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
            },
          }),
      })
      // Second call for accepting (error)
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'Esta invitación ya ha sido utilizada',
          }),
      });

    render(<AcceptInvitationPage />);

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText('Aceptar Invitación')).toBeInTheDocument();
    });

    // Click accept button
    const acceptButton = screen.getByText('Aceptar Invitación');
    fireEvent.click(acceptButton);

    // Should show error state instead of back to normal
    await waitFor(() => {
      expect(screen.getByText('Invitación No Válida')).toBeInTheDocument();
    });
  });

  it('allows user to cancel and go to signin', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          isValid: true,
          invitation: {
            email: 'test@example.com',
            role: 'ADMIN',
            expiresAt: new Date('2024-12-31T23:59:59Z').toISOString(),
          },
        }),
    });

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
  });

  it('redirects to signin from error state', async () => {
    mockSearchParams.get.mockReturnValue('invalid-token');
    (fetch as any).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: 'Token de invitación no válido',
        }),
    });

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(screen.getByText('Ir a Iniciar Sesión')).toBeInTheDocument();
    });

    const signinButton = screen.getByText('Ir a Iniciar Sesión');
    fireEvent.click(signinButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
  });

  it('handles network errors gracefully', async () => {
    mockSearchParams.get.mockReturnValue('valid-token');
    (fetch as any).mockRejectedValue(new Error('Network error'));

    render(<AcceptInvitationPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Error al validar la invitación')
      ).toBeInTheDocument();
    });
  });
});
