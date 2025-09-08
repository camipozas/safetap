import OrdersPage from '@/app/dashboard/orders/page';
import { prisma } from '@/lib/prisma';
import { render, screen } from '@testing-library/react';
import { getServerSession } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock getServerSession
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    sticker: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock the order helpers
vi.mock('@/lib/order-helpers', () => ({
  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    PAID: 'PAID',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  },
  ORDER_STATUS: {
    ORDERED: 'ORDERED',
    PAID: 'PAID',
    PRINTING: 'PRINTING',
    SHIPPED: 'SHIPPED',
    ACTIVE: 'ACTIVE',
    LOST: 'LOST',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  },
  analyzePayments: vi.fn((payments) => {
    if (!payments || payments.length === 0) {
      return {
        totalAmount: 0,
        hasValidPayment: false,
        latestStatus: null,
        currency: 'EUR',
      };
    }
    return {
      totalAmount: payments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      ),
      hasValidPayment: payments.some((p: any) => p.status === 'VERIFIED'),
      latestStatus: payments[0]?.status || null,
      currency: payments[0]?.currency || 'EUR',
    };
  }),
  getDisplayStatus: vi.fn((status, paymentInfo) => ({
    primaryStatus: status,
    description: status === 'ORDERED' ? 'Pedido creado' : 'Pedido pagado',
    secondaryStatuses: [],
  })),
}));

const mockOrders = [
  {
    id: 'order-1',
    slug: 'test-slug-1',
    serial: 'ST001',
    nameOnSticker: 'John Doe',
    flagCode: '🇺🇸',
    stickerColor: '#ffffff',
    textColor: '#000000',
    status: 'ORDERED',
    displayStatus: 'ORDERED',
    displayDescription: 'Pedido creado',
    displaySecondaryStatuses: [],
    createdAt: new Date('2024-01-01'),
    User: {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      country: 'US',
      totalSpent: 0,
    },
    EmergencyProfile: {
      bloodType: 'O+',
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      EmergencyContact: [
        {
          name: 'Emergency Contact',
          phone: '+1234567890',
          relation: 'Family',
        },
      ],
    },
    Payment: [
      {
        id: 'payment-1',
        status: 'VERIFIED',
        amount: 699000,
        currency: 'CLP',
        createdAt: new Date('2024-01-01'),
        reference: 'REF001',
      },
    ],
  },
  {
    id: 'order-2',
    slug: 'test-slug-2',
    serial: 'ST002',
    nameOnSticker: 'Jane Smith',
    flagCode: '🇬🇧',
    stickerColor: '#f0f0f0',
    textColor: '#333333',
    status: 'PAID',
    displayStatus: 'PAID',
    displayDescription: 'Pedido pagado',
    displaySecondaryStatuses: [],
    createdAt: new Date('2024-01-02'),
    User: {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      country: 'GB',
      totalSpent: 0,
    },
    EmergencyProfile: null,
    Payment: [],
  },
  {
    id: 'order-3',
    slug: 'test-slug-3',
    serial: 'ST003',
    nameOnSticker: 'Bob Wilson',
    flagCode: '🇨🇦',
    stickerColor: '#ffffff',
    textColor: '#000000',
    status: 'ORDERED',
    displayStatus: 'ORDERED',
    displayDescription: 'Pedido creado',
    displaySecondaryStatuses: [],
    createdAt: new Date('2024-01-03'),
    User: {
      id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      country: 'CA',
      totalSpent: 0,
    },
    EmergencyProfile: null,
    Payment: [],
  },
];

describe('Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getServerSession to return valid session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@example.com' },
    });

    // Mock user lookup for admin check
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'ADMIN',
    } as never);

    // Mock Prisma query with proper type casting
    vi.mocked(prisma.sticker.findMany).mockResolvedValue(mockOrders as never);
    vi.mocked(prisma.sticker.count).mockResolvedValue(3);
  });

  it('renders page title and description', async () => {
    const page = await OrdersPage({
      searchParams: Promise.resolve({ page: '1' }),
    });
    render(page);

    expect(screen.getByText('Gestión de Órdenes')).toBeInTheDocument();
    expect(
      screen.getByText(/Administra y supervisa todas las órdenes del sistema/)
    ).toBeInTheDocument();
  });

  it('displays orders table with correct data', async () => {
    const page = await OrdersPage({
      searchParams: Promise.resolve({ page: '1' }),
    });
    render(page);

    // Check table headers
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Check order data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();

    // Check status - use getAllByText for multiple elements
    const createdStatuses = screen.getAllByText('Creada');
    expect(createdStatuses).toHaveLength(2);
    expect(screen.getByText('Pagada')).toBeInTheDocument();

    // Check countries
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('GB')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('calls prisma with correct parameters', async () => {
    await OrdersPage({
      searchParams: Promise.resolve({ page: '1' }),
    });

    expect(prisma.sticker.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
            totalSpent: true,
            EmergencyProfile: {
              select: {
                bloodType: true,
                allergies: true,
                conditions: true,
                medications: true,
                notes: true,
                EmergencyContact: {
                  where: {
                    preferred: true,
                  },
                  take: 1,
                  select: {
                    name: true,
                    phone: true,
                    relation: true,
                  },
                },
              },
              orderBy: {
                updatedByUserAt: 'desc',
              },
              take: 1,
            },
          },
        },
        Payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            reference: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  });
});
