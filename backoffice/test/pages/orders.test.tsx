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
    createdAt: new Date('2024-01-01'),
    owner: {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      country: 'US',
    },
    profile: {
      bloodType: 'O+',
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      contacts: [],
    },
    payments: [
      {
        amountCents: 699000, // $6,990 CLP in cents
        currency: 'CLP',
        createdAt: new Date('2024-01-01'),
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
    createdAt: new Date('2024-01-02'),
    owner: {
      id: 'user-2',
      email: 'jane@example.com',
      name: 'Jane Smith',
      country: 'GB',
    },
    profile: null,
    payments: [],
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
    createdAt: new Date('2024-01-03'),
    owner: {
      id: 'user-3',
      email: 'bob@example.com',
      name: 'Bob Wilson',
      country: 'CA',
    },
    profile: null,
    payments: [],
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
    // The page shows statistics cards with numbers - there are multiple "3"s so use getAllByText
    expect(screen.getAllByText('3')).toHaveLength(2); // Total and Creadas both show 3
  });

  it('calls prisma with correct parameters', async () => {
    await OrdersPage();

    expect(prisma.sticker.findMany).toHaveBeenCalledWith({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
          },
        },
        profile: {
          select: {
            bloodType: true,
            allergies: true,
            conditions: true,
            medications: true,
            notes: true,
            contacts: {
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
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            amountCents: true,
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
