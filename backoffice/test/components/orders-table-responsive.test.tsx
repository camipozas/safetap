import OrdersTable from '@/components/ui/orders-table';
import { OrderStatus, PaymentStatus } from '@/lib/order-helpers';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
  formatCurrency: (amount: number, currency = 'CLP') =>
    `$${amount.toLocaleString('es-CL')} ${currency}`,
  formatDateTime: (date: Date) => new Date(date).toLocaleDateString(),
  getStatusColor: (_status: string) => 'bg-gray-100 text-gray-800',
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

vi.mock('@/components/ui/sticker-preview', () => ({
  default: ({
    sticker,
    size,
  }: {
    sticker: { nameOnSticker: string };
    size: number;
  }) => (
    <div data-testid="sticker-preview" style={{ width: size, height: size }}>
      {sticker.nameOnSticker}
    </div>
  ),
}));

interface MockOrder {
  id: string;
  serial: string;
  slug: string;
  nameOnSticker: string;
  flagCode: string;
  stickerColor: string;
  textColor: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    country: string;
  };
  profile: {
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes: string | null;
    contacts: Array<{
      name: string;
      phone: string;
      relation: string;
    }>;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: Date;
  }>;
}

const mockOrder: MockOrder = {
  id: '1',
  serial: 'ST001',
  slug: 'test-slug',
  nameOnSticker: 'Test User',
  flagCode: '🇨🇱',
  stickerColor: '#ffffff',
  textColor: '#000000',
  status: 'ORDERED',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  owner: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    country: 'Chile',
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
        phone: '+56 9 1234 5678',
        relation: 'Partner',
      },
    ],
  },
  payments: [
    {
      id: '1',
      amount: 25000,
      currency: 'CLP',
      status: 'VERIFIED',
      createdAt: new Date('2023-01-01'),
    },
  ],
};

describe('OrdersTable Responsive Design', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render desktop table', () => {
    render(<OrdersTable orders={[mockOrder]} />);

    const desktopTable = screen.getByRole('table');
    expect(desktopTable).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('should render mobile view elements', () => {
    render(<OrdersTable orders={[mockOrder]} />);

    // Mobile cards should be present (they use lg:hidden)
    const mobileSelectAll = screen.getByText('Seleccionar todas las órdenes');
    expect(mobileSelectAll).toBeInTheDocument();
  });

  it('should show correct payment information in CLP', () => {
    render(<OrdersTable orders={[mockOrder]} />);

    expect(screen.getAllByText('$25.000')).toHaveLength(2); // Desktop + mobile
  });

  it('should handle orders without profile information', () => {
    const orderWithoutProfile = {
      ...mockOrder,
      profile: null,
    };

    render(<OrdersTable orders={[orderWithoutProfile]} />);

    expect(screen.getAllByText('-')).toHaveLength(2); // Blood type placeholder - Desktop + mobile
  });

  it('should show empty state when no orders', () => {
    render(<OrdersTable orders={[]} />);

    expect(screen.getByText('No hay órdenes registradas')).toBeInTheDocument();
  });
});
