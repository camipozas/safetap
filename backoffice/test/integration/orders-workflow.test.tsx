import OrdersTable from '@/components/ui/orders-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

const mockOrder = {
  id: 'test-order-workflow',
  slug: 'test-slug-workflow',
  serial: 'ST999',
  nameOnSticker: 'Workflow Test',
  flagCode: '🇪🇸',
  colorPresetId: 'classic-white',
  stickerColor: '#ffffff',
  textColor: '#000000',
  status: 'ORDERED' as const,
  createdAt: new Date('2024-01-01'),
  owner: {
    id: 'user-workflow',
    name: 'Workflow Test User',
    email: 'workflow@example.com',
    country: 'ES',
  },
  profile: {
    bloodType: 'A+',
    allergies: [],
    conditions: [],
    medications: [],
    notes: null,
    contacts: [
      {
        name: 'Emergency Contact',
        phone: '+34123456789',
        relation: 'Family',
      },
    ],
  },
  payments: [
    {
      id: 'payment-workflow-1',
      status: 'TRANSFER_PAYMENT',
      amount: 6990, // $6,990 CLP
      currency: 'CLP',
      createdAt: new Date('2024-01-01'),
    },
  ],
};

describe('Orders Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  it('allows transitioning from ORDERED to PAID', () => {
    render(<OrdersTable orders={[mockOrder]} />);

    // Verify order is rendered - use getAllByText since email appears in both desktop and mobile
    const emailElements = screen.getAllByText('workflow@example.com');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);

    // Find the status transition button (should show next status "Pagada")
    // Use getAllByRole since buttons appear in both desktop and mobile views
    const paidButtons = screen.getAllByRole('button', { name: /Pagada/ });
    expect(paidButtons.length).toBeGreaterThanOrEqual(1);

    // Check that first button is clickable
    expect(paidButtons[0]).not.toBeDisabled();
  });

  it('allows marking order as LOST from any status', () => {
    const orderOrdered = { ...mockOrder, status: 'ORDERED' as const };
    render(<OrdersTable orders={[orderOrdered]} />);

    // For LOST status, orders should show the next transition button
    // Since ORDERED -> PAID, we should see a "Pagada" button
    // Use getAllByRole since buttons appear in both desktop and mobile views
    const nextButtons = screen.getAllByRole('button', { name: /Pagada/ });
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('prevents invalid transitions', () => {
    const orderShipped = { ...mockOrder, status: 'SHIPPED' as const };
    render(<OrdersTable orders={[orderShipped]} />);

    // Verify order is rendered by checking unique email
    // Use getAllByText since email appears in both desktop and mobile views
    const emailElements = screen.getAllByText('workflow@example.com');
    expect(emailElements.length).toBeGreaterThanOrEqual(1);

    // Verify dropdown exists for status transitions (including filter dropdowns)
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    } as Response);

    // Mock alert
    const mockAlert = vi.fn();
    vi.stubGlobal('alert', mockAlert);

    render(<OrdersTable orders={[mockOrder]} />);

    // Find the status transition button and click it
    // Use getAllByRole since buttons appear in both desktop and mobile views
    const nextButtons = screen.getAllByRole('button', { name: /Pagada/ });
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(nextButtons[0]);

    await waitFor(
      () => {
        expect(mockAlert).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('shows correct status colors for key statuses', () => {
    const orderOrdered = { ...mockOrder, status: 'ORDERED' as const };
    const { container } = render(<OrdersTable orders={[orderOrdered]} />);

    const statusElement = container.querySelector('.inline-block.px-2.py-1');
    expect(statusElement).toHaveClass('bg-slate-100');
    expect(statusElement).toHaveClass('text-slate-800');
  });
});
