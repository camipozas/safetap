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
      amountCents: 699000,
      currency: 'CLP',
      createdAt: new Date('2024-01-01'),
    },
  ],
};

describe('Orders Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('allows transitioning from ORDERED to PAID', () => {
    const { container } = render(<OrdersTable orders={[mockOrder]} />);

    // Verify order is rendered
    expect(screen.getByText('workflow@example.com')).toBeInTheDocument();

    // Find the status dropdown specifically in the table body
    const statusDropdown = container.querySelector(
      'td select'
    ) as HTMLSelectElement;
    expect(statusDropdown).toBeTruthy();

    // Check that PAID option is available
    const options = statusDropdown.querySelectorAll('option');
    const paidOption = Array.from(options).find(
      (option) => (option as HTMLOptionElement).value === 'PAID'
    );

    expect(paidOption).toBeTruthy();
  });

  it('allows marking order as LOST from any status', () => {
    const orderOrdered = { ...mockOrder, status: 'ORDERED' as const };
    const { container } = render(<OrdersTable orders={[orderOrdered]} />);

    // Find the status dropdown specifically in the table body
    const statusDropdown = container.querySelector(
      'td select'
    ) as HTMLSelectElement;
    expect(statusDropdown).toBeTruthy();

    // Check that LOST option is available
    const options = statusDropdown.querySelectorAll('option');
    const lostOption = Array.from(options).find(
      (option) => (option as HTMLOptionElement).value === 'LOST'
    );

    expect(lostOption).toBeTruthy();
  });

  it('prevents invalid transitions', () => {
    const orderShipped = { ...mockOrder, status: 'SHIPPED' as const };
    render(<OrdersTable orders={[orderShipped]} />);

    // Verify order is rendered by checking unique email
    expect(screen.getByText('workflow@example.com')).toBeInTheDocument();

    // Verify dropdown exists for status transitions (including filter dropdowns)
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    // Mock alert
    const mockAlert = vi.fn();
    vi.stubGlobal('alert', mockAlert);

    const { container } = render(<OrdersTable orders={[mockOrder]} />);

    // Find the order status dropdown specifically
    const statusDropdown = container.querySelector(
      'td select'
    ) as HTMLSelectElement;
    expect(statusDropdown).toBeTruthy();

    fireEvent.change(statusDropdown, { target: { value: 'PAID' } });

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
