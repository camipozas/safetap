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

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock Next.js Suspense
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the auth function
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: {
      email: 'test@example.com',
    },
  })),
}));

// Mock the prisma client with REJECTED payment
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(() => ({
        id: 'user-123',
        email: 'test@example.com',
        Payment: [
          {
            id: 'payment-123',
            status: 'REJECTED', // This is the key difference - REJECTED payment
            amount: 6990,
            currency: 'CLP',
            createdAt: new Date('2025-08-20'),
            quantity: 1,
            Sticker: {
              id: 'sticker-123',
              ownerId: 'user-123', // Must match user.id for sticker to show
              nameOnSticker: 'Test User',
              flagCode: 'CL',
              stickerColor: '#f1f5f9',
              textColor: '#000000',
              status: 'ORDERED',
              slug: 'test-user',
              serial: 'ST123',
            },
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

// Mock PaymentReferenceHandler component
vi.mock('@/components/PaymentReferenceHandler', () => ({
  default: () => null,
}));

// Mock BankAccountInfo component
vi.mock('@/components/BankAccountInfo', () => ({
  default: () => <div data-testid="bank-account-info">Bank Account Info</div>,
}));

// Mock EditProfileButton component
vi.mock('@/components/EditProfileButton', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="edit-profile-button">{children}</button>
  ),
}));

describe('AccountPage - Rejected Payment Handling', () => {
  it('hides profile buttons when payment is rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should NOT show profile buttons when payment status is REJECTED
    expect(screen.queryByText('Ver perfil público')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Editar información de emergencia')
    ).not.toBeInTheDocument();

    // Should show rejection message instead
    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
    expect(
      screen.getByText('Por favor, contacta con soporte para más información')
    ).toBeInTheDocument();
  });

  it('hides pending payment section when payment is rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should NOT show pending payment section when payment status is REJECTED
    expect(screen.queryByText('Pendiente de pago')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver datos bancarios')).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Realiza la transferencia bancaria para procesar tu pedido'
      )
    ).not.toBeInTheDocument();
  });

  it('still shows payment status information for rejected payment', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should still show the payment status for transparency
    expect(screen.getByText('Estado del pago:')).toBeInTheDocument();
    expect(screen.getByText('❌ Rechazado')).toBeInTheDocument();
  });

  it('displays sticker information even when payment is rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify sticker details are still shown
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('País: CL')).toBeInTheDocument();
    expect(
      screen.getByText('Sticker Preview: Test User - CL')
    ).toBeInTheDocument();
  });

  it('shows rejection banner with error styling', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Look for the rejection message with the error icon
    const rejectionMessage = screen.getByText('Pago rechazado');
    expect(rejectionMessage).toBeInTheDocument();

    // The message itself should have the error styling classes
    expect(rejectionMessage).toHaveClass('font-medium', 'text-red-800');
  });
});
