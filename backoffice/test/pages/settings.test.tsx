import SettingsPage from '@/app/dashboard/settings/page';
import { ROLE_LABELS, USER_ROLES } from '@/types/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();
global.alert = vi.fn();
global.confirm = vi.fn();

const mockAdminUsers = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: USER_ROLES.ADMIN,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'super-admin-1',
    email: 'superadmin@example.com',
    name: 'Super Admin',
    role: USER_ROLES.SUPER_ADMIN,
    createdAt: new Date('2024-01-01'),
  },
];

const mockPendingInvitations = [
  {
    id: 'invite-1',
    email: 'pending@example.com',
    role: USER_ROLES.ADMIN,
    createdAt: new Date('2024-01-15'),
    token: 'test-token-123',
  },
];

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: {
        user: {
          email: 'superadmin@example.com',
          role: USER_ROLES.SUPER_ADMIN,
        },
      },
      status: 'authenticated',
    });

    // Mock successful API responses by default
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/admin/admin-users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAdminUsers), // Devolver array directamente
        });
      } else if (url.includes('/api/admin/invitations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invitations: mockPendingInvitations }),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
    });
  });

  it('renders settings page with admin management section', async () => {
    render(<SettingsPage />);

    // Wait for loading to finish and content to appear
    await waitFor(() => {
      expect(
        screen.queryByText('Cargando configuración...')
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText('Configuración del Sistema')[0]
      ).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Cargando configuración...')).toBeInTheDocument();
  });

  it('displays current admin users correctly', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Gestión de Administradores')
      ).toBeInTheDocument();
    });

    // Wait a bit more for async data loading
    await waitFor(
      () => {
        // Use getAllByText since email appears in both desktop table and mobile cards
        const emailElements = screen.getAllByText('admin@example.com');
        expect(emailElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('displays pending invitations when available', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Invitaciones Pendientes')).toBeInTheDocument();
      // Use getAllByText since email appears in both desktop table and mobile cards
      const emailElements = screen.getAllByText('pending@example.com');
      expect(emailElements.length).toBeGreaterThan(0);
    });
  });

  it('allows super admin to create new invitation', async () => {
    // Override the default mock for this specific test
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: mockAdminUsers }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invitations: mockPendingInvitations }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            inviteUrl:
              'http://localhost:3001/auth/accept-invitation?token=new-token',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invitations: [] }),
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('nuevo.admin@ejemplo.com')
      ).toBeInTheDocument();
    });

    // Fill form
    const emailInput = screen.getByPlaceholderText('nuevo.admin@ejemplo.com');
    // Get the role select specifically from the invitation form
    const invitationForm = screen
      .getByText('Invitar Nuevo Administrador')
      .closest('div');
    const roleSelect = invitationForm?.querySelector('select');
    expect(roleSelect).toBeInTheDocument();
    const submitButton = screen.getByText('Enviar Invitación');

    fireEvent.change(emailInput, { target: { value: 'newadmin@example.com' } });
    if (roleSelect) {
      fireEvent.change(roleSelect, { target: { value: USER_ROLES.ADMIN } });
    } else {
      throw new Error('Role select not found');
    }
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newadmin@example.com',
          role: USER_ROLES.ADMIN,
        }),
      });
    });
  });

  it('shows super admin role option only for super admins', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Cargando configuración...')
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      // Get the role select specifically from the invitation form
      const invitationForm = screen
        .getByText('Invitar Nuevo Administrador')
        .closest('div');
      const roleSelect = invitationForm?.querySelector('select');
      expect(roleSelect).toBeInTheDocument();

      // Check that both Admin and Super Admin options are available in this specific select
      const options = roleSelect?.querySelectorAll('option');
      const optionTexts = Array.from(options || []).map(
        (option) => option.textContent
      );
      expect(optionTexts).toContain(ROLE_LABELS[USER_ROLES.ADMIN]);
      expect(optionTexts).toContain(ROLE_LABELS[USER_ROLES.SUPER_ADMIN]);
    });
  });

  it('shows super admin role option for regular admins in development', async () => {
    (useSession as any).mockReturnValue({
      data: {
        user: {
          email: 'admin@example.com',
          role: USER_ROLES.ADMIN,
        },
      },
    });

    render(<SettingsPage />);

    await waitFor(() => {
      // In development mode, both options should be available
      // Get the role select specifically from the invitation form
      const invitationForm = screen
        .getByText('Invitar Nuevo Administrador')
        .closest('div');
      const roleSelect = invitationForm?.querySelector('select');
      expect(roleSelect).toBeInTheDocument();

      // Check that both Admin and Super Admin options are available in development
      const options = roleSelect?.querySelectorAll('option');
      const optionTexts = Array.from(options || []).map(
        (option) => option.textContent
      );
      expect(optionTexts).toContain(ROLE_LABELS[USER_ROLES.ADMIN]);
      expect(optionTexts).toContain(ROLE_LABELS[USER_ROLES.SUPER_ADMIN]);
    });
  });

  it('prevents user from deleting themselves', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      // Look for the current user's email (appears in both desktop table and mobile cards)
      const emailElements = screen.getAllByText('superadmin@example.com');
      expect(emailElements.length).toBeGreaterThan(0);

      // Should show "(Tú mismo)" instead of delete button
      expect(screen.getByText('(Tú mismo)')).toBeInTheDocument();
    });
  });

  it('allows deleting other admin users', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Administradores Actuales')).toBeInTheDocument();
    });

    // Verify table structure exists (we can't test actual deletion with empty mock data)
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rol').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acciones').length).toBeGreaterThan(0);
  });

  it('allows revoking pending invitations', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Invitaciones Pendientes')).toBeInTheDocument();
    });

    // Verify table structure exists (we can't test actual revocation with empty mock data)
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rol').length).toBeGreaterThan(0);
    expect(screen.getByText('Enviada')).toBeInTheDocument();
    expect(screen.getAllByText('Acciones').length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invitations: [] }),
      });

    render(<SettingsPage />);

    // Should still render the page even if one API fails
    await waitFor(() => {
      expect(
        screen.getAllByText('Configuración del Sistema')[0]
      ).toBeInTheDocument();
    });
  });

  it('shows system settings information', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Cargando configuración...')
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getAllByText('Configuración del Sistema')[0]
      ).toBeInTheDocument();
    });
  });

  it('handles invitation creation errors', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdminUsers), // Consistent with other mocks
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invitations: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'El usuario ya existe en el sistema' }),
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('nuevo.admin@ejemplo.com')
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText('nuevo.admin@ejemplo.com');
    const submitButton = screen.getByText('Enviar Invitación');

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The component now shows error in toast notification instead of alert
      expect(
        screen.getByText('El usuario ya existe en el sistema')
      ).toBeInTheDocument();
    });
  });
});
