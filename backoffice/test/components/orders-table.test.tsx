import OrdersTable from '@/components/ui/orders-table';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

const mockOrders = [
  {
    id: 'test-order-1',
    slug: 'test-slug-1',
    serial: 'ST001',
    nameOnSticker: 'John Doe',
    flagCode: '🇺🇸',
    stickerColor: '#ffffff',
    textColor: '#000000',
    status: 'ORDERED' as const,
    createdAt: new Date('2024-01-01'),
    owner: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      country: 'US',
    },
    profile: {
      bloodType: 'O+',
      allergies: ['Peanuts'],
      conditions: ['Diabetes'],
      medications: ['Insulin'],
      notes: 'Emergency contact: Jane Doe',
      contacts: [
        {
          name: 'Jane Doe',
          phone: '+1234567890',
          relation: 'Spouse',
        },
      ],
    },
    payments: [
      {
        amountCents: 2500,
        currency: 'EUR',
        createdAt: new Date('2024-01-01'),
      },
    ],
  },
  {
    id: 'test-order-2',
    slug: 'test-slug-2',
    serial: 'ST002',
    nameOnSticker: 'Jane Smith',
    flagCode: '🇬🇧',
    stickerColor: '#f0f0f0',
    textColor: '#333333',
    status: 'PAID' as const,
    createdAt: new Date('2024-01-02'),
    owner: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      country: 'GB',
    },
    profile: null,
    payments: [],
  },
];

describe('OrdersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('renders orders correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check emails which should be unique
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    // Check that names appear (but they might appear multiple times due to sticker preview)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
  });

  it('displays status labels correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Use querySelector to find status badge specifically
    const statusBadges = document.querySelectorAll('.inline-block.px-2.py-1');
    expect(statusBadges.length).toBeGreaterThan(0);

    // Check that status badges contain expected text
    const statusTexts = Array.from(statusBadges).map(
      (badge) => badge.textContent
    );
    expect(statusTexts).toContain('Creada');
    expect(statusTexts).toContain('Pagada');
  });

  it('shows transition dropdowns for valid statuses', () => {
    render(<OrdersTable orders={mockOrders} />);

    // There are filter dropdowns (2) + order status dropdowns (2) = 4 total
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toBeGreaterThanOrEqual(4);
  });

  it('updates order status when dropdown selection changes', async () => {
    const { container } = render(<OrdersTable orders={mockOrders} />);

    // Find the status dropdown specifically in the table body
    const statusDropdown = container.querySelector(
      'td select'
    ) as HTMLSelectElement;
    expect(statusDropdown).toBeTruthy();

    fireEvent.change(statusDropdown, { target: { value: 'PAID' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/orders/test-order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      });
    });
  });

  it('filters orders by status', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Get the first filter dropdown (status filter)
    const filters = screen.getAllByDisplayValue('Todos');
    const statusFilter = filters[0]; // First dropdown is status filter
    fireEvent.change(statusFilter, { target: { value: 'ORDERED' } });

    // Check that John's email still appears (ORDERED status)
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    // Check that Jane's email doesn't appear (PAID status, filtered out)
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
  });

  it('filters orders by country', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Get the second filter dropdown (country filter)
    const filters = screen.getAllByDisplayValue('Todos');
    const countryFilter = filters[1]; // Second dropdown is country filter
    fireEvent.change(countryFilter, { target: { value: 'US' } });

    // Check that John's email still appears (US country)
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    // Check that Jane's email doesn't appear (GB country, filtered out)
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
  });

  it('displays payment information correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check payment amount exists
    expect(screen.getByText('25,00 €')).toBeInTheDocument();
    // Check for no payment text
    expect(screen.getAllByText('Sin pago')).toHaveLength(1);
  });

  it('shows blood type when available', () => {
    render(<OrdersTable orders={mockOrders} />);

    expect(screen.getByText('🩸 O+')).toBeInTheDocument();
  });

  it('displays emergency contact information', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check for emergency contact name (might appear in multiple places)
    expect(screen.getAllByText('Jane Doe')).toHaveLength(1);
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('handles bulk selection', () => {
    render(<OrdersTable orders={mockOrders} />);

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    const individualCheckboxes = screen.getAllByRole('checkbox').slice(1);
    individualCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('renders profile buttons correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    const profileButtons = screen.getAllByText('Perfil');
    expect(profileButtons.length).toBeGreaterThan(0);

    // Check that button is clickable and has correct title
    expect(profileButtons[0]).toBeInTheDocument();
    expect(profileButtons[0]).not.toBeDisabled();
    expect(profileButtons[0]).toHaveAttribute(
      'title',
      'Ver detalles completos del usuario'
    );
  });
});
