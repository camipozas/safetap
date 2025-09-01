import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AccountPage from '@/app/account/page';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock the auth function
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: {
      email: 'test@example.com',
    },
  })),
}));

// Mock the prisma client with ORDERED status and no payments (or non-rejected payment)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(() => ({
        id: 'user-123',
        email: 'test@example.com',
        Sticker: [
          {
            id: 'sticker-123',
            nameOnSticker: 'Test User',
            flagCode: 'CL',
            stickerColor: '#f1f5f9',
            textColor: '#000000',
            status: 'ORDERED', // This is the key - ORDERED status
            slug: 'test-user',
            serial: 'ST123',
            Payment: [
              {
                id: 'payment-123',
                status: 'PENDING', // NOT rejected, so should show pending payment section
                amount: 6990,
                currency: 'CLP',
                createdAt: new Date('2025-08-20'),
              },
            ],
          },
        ],
      })),
    },
  },
}));

// Mock the PaymentsTable component
vi.mock('@/components/PaymentsTable', () => ({
  PaymentsTable: () => <div data-testid="payments-table">Payments Table</div>,
}));

// Mock the StickerPreview component
vi.mock('@/components/StickerPreview', () => ({
  default: ({ name, flagCode }: { name: string; flagCode: string }) => (
    <div data-testid="sticker-preview">
      Sticker Preview: {name} - {flagCode}
    </div>
  ),
}));

// Mock the ActivateStickerButton component
vi.mock('@/components/ActivateStickerButton', () => ({
  default: ({
    stickerId,
    hasValidPayment,
    status,
  }: {
    stickerId: string;
    hasValidPayment: boolean;
    status: string;
  }) => (
    <div data-testid="activate-button">
      Activate Button: {stickerId} - {hasValidPayment} - {status}
    </div>
  ),
}));

describe('AccountPage - Pending Payment Visibility', () => {
  it('shows pending payment section when sticker is ORDERED and payment is not rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should show pending payment section when status is ORDERED and payment is not REJECTED
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
    expect(screen.getByText('Ver datos bancarios')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Realiza la transferencia bancaria para procesar tu pedido'
      )
    ).toBeInTheDocument();

    // Should NOT show rejection message
    expect(screen.queryByText('Pago rechazado')).not.toBeInTheDocument();
  });

  it('shows correct payment status for pending payment', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should show the payment status
    expect(screen.getByText('Estado del pago:')).toBeInTheDocument();
    expect(screen.getByText('⏳ Pendiente')).toBeInTheDocument();
  });

  it('displays sticker information for pending payment', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify sticker details are shown
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('País: CL')).toBeInTheDocument();
    expect(
      screen.getByText('Sticker Preview: Test User - CL')
    ).toBeInTheDocument();
  });

  it('still shows profile buttons when payment is pending but not rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should show profile buttons when payment is PENDING (not REJECTED)
    expect(screen.getByText('Ver perfil público')).toBeInTheDocument();
    expect(screen.getByText('Editar información')).toBeInTheDocument();
  });
});
