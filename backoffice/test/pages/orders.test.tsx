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
    },
  },
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
    },
    EmergencyProfile: {
      bloodType: 'O+',
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      EmergencyContact: [],
    },
    Payment: [
      {
        id: 'payment-1',
        status: 'VERIFIED',
        amount: 699000, // $6,990 CLP in cents
        currency: 'CLP',
        createdAt: new Date('2024-01-01'),
      },
    ],
    paymentInfo: {
      totalAmount: 699000,
      hasValidPayment: true,
      latestStatus: 'VERIFIED',
    },
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
    displayStatus: 'ORDERED',
    displayDescription: 'Pedido creado',
    displaySecondaryStatuses: [],
    createdAt: new Date('2024-01-02'),
    User: {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      country: 'GB',
    },
    EmergencyProfile: null,
    Payment: [],
    paymentInfo: {
      totalAmount: 0,
      hasValidPayment: false,
      latestStatus: null,
    },
  },
  {
    id: 'order-3',
    slug: 'test-slug-3',
    serial: 'ST003',
    nameOnSticker: 'Bob Wilson',
    flagCode: '🇨🇦',
    stickerColor: '#ffffff',
    textColor: '#000000',
    status: 'ACTIVE',
    displayStatus: 'ORDERED',
    displayDescription: 'Pedido creado',
    displaySecondaryStatuses: [],
    createdAt: new Date('2024-01-03'),
    User: {
      id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      country: 'CA',
    },
    EmergencyProfile: null,
    Payment: [],
    paymentInfo: {
      totalAmount: 0,
      hasValidPayment: false,
      latestStatus: null,
    },
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
  });

  it('renders page title and description', async () => {
    const page = await OrdersPage();
    render(page);

    expect(screen.getByText('Gestión de Órdenes')).toBeInTheDocument();
    expect(
      screen.getByText('Administra y supervisa todas las órdenes del sistema')
    ).toBeInTheDocument();
  });

  it('displays main page elements', async () => {
    const page = await OrdersPage();
    render(page);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Creadas')).toBeInTheDocument();

    // The page shows statistics cards with numbers
    // Based on the current mock data:
    // - Total: 3 orders
    // - Creadas (ORDERED): 2 orders
    // - Pagadas (PAID): 1 order
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('2')).toBeInTheDocument(); // Creadas
    expect(screen.getByText('1')).toBeInTheDocument(); // Pagadas
  });

  it('calls prisma with correct parameters', async () => {
    await OrdersPage();

    expect(prisma.sticker.findMany).toHaveBeenCalledWith({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
            totalSpent: true,
          },
        },
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
        },
        Payment: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            amount: true,
            currency: true,
            createdAt: true,
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });
});
