import OrdersTable from '@/components/ui/orders-table';
import { OrderStatus, PaymentStatus } from '@/lib/order-helpers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the utils functions
vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
  formatCurrency: (amount: number, currency = 'CLP') =>
    `$${amount.toLocaleString('es-CL')} ${currency}`,
  formatDateTime: (date: Date) => new Date(date).toLocaleDateString(),
  getStatusColor: (_status: string) => 'bg-gray-100 text-gray-800',
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockOrders = [
  {
    id: 'test-order-1',
    slug: 'test-slug-1',
    serial: 'ST001',
    nameOnSticker: 'John Doe',
    flagCode: '🇺🇸',
    colorPresetId: 'classic-white',
    stickerColor: '#ffffff',
    textColor: '#000000',
    status: 'ORDERED' as OrderStatus,
    groupId: null,
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
        id: 'payment-1',
        status: 'VERIFIED' as PaymentStatus,
        amount: 699000, // $6,990 CLP in cents
        currency: 'CLP',
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
    colorPresetId: 'classic-gray',
    stickerColor: '#f0f0f0',
    textColor: '#333333',
    status: 'PAID' as OrderStatus,
    groupId: null,
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
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  it('renders orders correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check emails which appear in both desktop and mobile views
    expect(screen.getAllByText('john@example.com')).toHaveLength(2);
    expect(screen.getAllByText('jane@example.com')).toHaveLength(2);

    // Check that names appear (but they might appear multiple times due to sticker preview)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
  });

  it('updates order status when button clicked', async () => {
    render(<OrdersTable orders={mockOrders} />);

    // Find status transition buttons - there should be buttons for both desktop and mobile
    const paidButtons = screen.getAllByRole('button', { name: /Pagada/ });
    expect(paidButtons).toHaveLength(2); // One for desktop, one for mobile

    fireEvent.click(paidButtons[0]); // Click the first one

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

    // Check that John's email still appears (ORDERED status) - should appear in filtered result
    expect(screen.getAllByText('john@example.com')).toHaveLength(2); // Desktop + mobile
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
    expect(screen.getAllByText('john@example.com')).toHaveLength(2); // Desktop + mobile
    // Check that Jane's email doesn't appear (GB country, filtered out)
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
  });

  it('displays payment information correctly', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check payment amount exists - appears in both desktop and mobile (699000 cents = $699.000)
    expect(screen.getAllByText('$699.000')).toHaveLength(2);
    // Check for no payment text - appears more times due to responsive design
    expect(screen.getAllByText('Sin pago')).toHaveLength(4); // Desktop + mobile + responsive variants
  });

  it('shows blood type when available', () => {
    render(<OrdersTable orders={mockOrders} />);

    expect(screen.getAllByText('🩸 O+')).toHaveLength(2); // Desktop + mobile
  });

  it('displays emergency contact information', () => {
    render(<OrdersTable orders={mockOrders} />);

    // Check for emergency contact name (appears in both desktop and mobile views)
    expect(screen.getAllByText('Jane Doe')).toHaveLength(2);
    expect(screen.getAllByText('+1234567890')).toHaveLength(2);
  });
});
