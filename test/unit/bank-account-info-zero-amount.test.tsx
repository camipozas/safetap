import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import BankAccountInfo from '@/components/BankAccountInfo';

vi.mock('@/lib/bank-info', () => ({
  BANK_INFO: {
    company: 'SafeTap SpA',
    rut: '12.345.678-9',
    bank: 'Banco de Chile',
    accountType: 'Cuenta Corriente',
    accountNumber: '1234567890',
    email: 'contacto@safetap.cl',
  },
  getBankInfoText: () => 'Mock bank info text',
}));

describe('BankAccountInfo Component - Zero Amount Handling', () => {
  test('should not render anything for zero amount transactions', () => {
    const { container } = render(
      <BankAccountInfo
        paymentReference={{
          reference: 'SAFETAP-ZERO123',
          amount: 0,
          description: 'Free sticker with discount',
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('should render normally for non-zero amount transactions', () => {
    render(
      <BankAccountInfo
        paymentReference={{
          reference: 'SAFETAP-REGULAR123',
          amount: 6990,
          description: 'Regular sticker purchase',
        }}
      />
    );

    expect(screen.getByText('Datos Bancarios')).toBeInTheDocument();
    expect(screen.getByText('Referencia de Pago')).toBeInTheDocument();
    expect(screen.getByText('SAFETAP-REGULAR123')).toBeInTheDocument();
    expect(screen.getByText('$6.990')).toBeInTheDocument();
  });

  test('should render normally when no payment reference is provided', () => {
    render(<BankAccountInfo />);

    expect(screen.getByText('Datos Bancarios')).toBeInTheDocument();
    expect(screen.queryByText('Referencia de Pago')).not.toBeInTheDocument();
  });

  test('should render normally when payment reference is null', () => {
    render(<BankAccountInfo paymentReference={null} />);

    expect(screen.getByText('Datos Bancarios')).toBeInTheDocument();
    expect(screen.queryByText('Referencia de Pago')).not.toBeInTheDocument();
  });

  test('should handle edge case with very small positive amount', () => {
    render(
      <BankAccountInfo
        paymentReference={{
          reference: 'SAFETAP-SMALL123',
          amount: 1,
          description: 'Very small amount',
        }}
      />
    );

    expect(screen.getByText('Datos Bancarios')).toBeInTheDocument();
    expect(screen.getByText('$1')).toBeInTheDocument();
  });

  test('should handle negative amounts (edge case)', () => {
    render(
      <BankAccountInfo
        paymentReference={{
          reference: 'SAFETAP-NEGATIVE123',
          amount: -100,
          description: 'Negative amount (refund)',
        }}
      />
    );

    expect(screen.getByText('Datos Bancarios')).toBeInTheDocument();
    expect(screen.getByText('$-100')).toBeInTheDocument();
  });
});
