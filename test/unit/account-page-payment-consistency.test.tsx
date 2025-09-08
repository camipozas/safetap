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

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(() => ({
        id: 'user-123',
        email: 'test@example.com',
        Payment: [
          {
            id: 'payment-123',
            status: 'VERIFIED', // Verified payment
            amount: 6990,
            currency: 'CLP',
            reference: 'SAFETAP-TEST-123',
            createdAt: new Date('2025-08-20'),
            quantity: 1,
            Sticker: {
              id: 'sticker-123',
              ownerId: 'user-123', // Must match user.id for sticker to show
              nameOnSticker: 'Test User',
              flagCode: 'CL',
              stickerColor: '#f1f5f9',
              textColor: '#000000',
              status: 'PAID', // PAID status for verified payment
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

// Mock the PaymentReferenceHandler component
vi.mock('@/components/PaymentReferenceHandler', () => ({
  default: () => null,
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

describe('AccountPage - Payment Consistency', () => {
  it('displays consistent payment information between sticker status and payment details', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify that the sticker shows "Pago confirmado" status
    expect(screen.getByText('Pago confirmado')).toBeInTheDocument();
    expect(
      screen.getByText('Tu sticker está en cola de impresión')
    ).toBeInTheDocument();

    // Verify that the payment status is also displayed
    expect(screen.getByText('Estado del pago:')).toBeInTheDocument();
    expect(screen.getByText('✅ Verificado')).toBeInTheDocument();

    // Verify that the sticker status is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('País: CL')).toBeInTheDocument();
  });

  it('shows payment status information for each sticker', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify that payment status is shown for each sticker
    const paymentStatusElement = screen.getByText('Estado del pago:');
    expect(paymentStatusElement).toBeInTheDocument();

    // Verify the payment status text
    const statusText = paymentStatusElement.parentElement?.textContent;
    expect(statusText).toContain('✅ Verificado');
  });

  it('displays sticker information correctly', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify sticker details
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('País: CL')).toBeInTheDocument();
    expect(
      screen.getByText('Sticker Preview: Test User - CL')
    ).toBeInTheDocument();
  });

  it('includes payments table component', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Verify that the payments table is rendered
    expect(screen.getByTestId('payments-table')).toBeInTheDocument();
  });

  it('shows profile buttons when payment is not rejected', async () => {
    const page = await AccountPage({ searchParams: Promise.resolve({}) });
    render(page);

    // Should show profile buttons when payment status is VERIFIED (not REJECTED)
    expect(screen.getByText('Ver perfil público')).toBeInTheDocument();
    expect(
      screen.getByText('Editar información de emergencia')
    ).toBeInTheDocument();
    expect(screen.queryByText('Pago rechazado')).not.toBeInTheDocument();
  });
});
