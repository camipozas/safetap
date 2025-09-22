/**
 * Helper to generate consistent and easy-to-remember payment references
 */

export interface PaymentReferenceData {
  date: Date;
  orderNumber: number;
  customerInitials?: string;
  productCode?: string;
}

export type ReferenceFormat =
  | 'DATE_SEQUENTIAL'
  | 'DATE_CUSTOMER'
  | 'DATE_PRODUCT';

/**
 * Generate a payment reference in the specified format
 */
export function generatePaymentReference(
  data: PaymentReferenceData,
  format: ReferenceFormat = 'DATE_SEQUENTIAL'
): string {
  const date = data.date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const orderNum = String(data.orderNumber).padStart(3, '0');

  switch (format) {
    case 'DATE_SEQUENTIAL':
      return `SAFETAP-${year}-${month}-${day}-${orderNum}`;

    case 'DATE_CUSTOMER':
      if (!data.customerInitials) {
        throw new Error('Customer initials required for DATE_CUSTOMER format');
      }
      return `SAFETAP-${year}-${month}-${day}-${data.customerInitials.toUpperCase()}`;

    case 'DATE_PRODUCT':
      if (!data.productCode) {
        throw new Error('Product code required for DATE_PRODUCT format');
      }
      return `SAFETAP-${year}-${month}-${day}-${data.productCode.toUpperCase()}`;

    default:
      return `SAFETAP-${year}-${month}-${day}-${orderNum}`;
  }
}

/**
 * Generate a payment reference with date + sequential format (recommended)
 */
export function generateSequentialReference(
  date: Date,
  orderNumber: number
): string {
  return generatePaymentReference({ date, orderNumber }, 'DATE_SEQUENTIAL');
}

/**
 * Generate a payment reference with date + customer initials format
 */
export function generateCustomerReference(
  date: Date,
  customerInitials: string
): string {
  return generatePaymentReference(
    { date, orderNumber: 0, customerInitials },
    'DATE_CUSTOMER'
  );
}

/**
 * Generate a payment reference with date + product code format
 */
export function generateProductReference(
  date: Date,
  productCode: string
): string {
  return generatePaymentReference(
    { date, orderNumber: 0, productCode },
    'DATE_PRODUCT'
  );
}

/**
 * Validate if a reference has the correct format
 */
export function isValidPaymentReference(reference: string): boolean {
  const pattern = /^SAFETAP-\d{4}-\d{2}-\d{2}-[A-Z0-9]{1,3}$/;
  return pattern.test(reference);
}

/**
 * Extract information from a valid reference
 */
export function parsePaymentReference(reference: string): {
  date: Date;
  identifier: string;
  isValid: boolean;
} {
  if (!isValidPaymentReference(reference)) {
    return {
      date: new Date(),
      identifier: '',
      isValid: false,
    };
  }

  const parts = reference.split('-');
  const year = parseInt(parts[1]);
  const month = parseInt(parts[2]) - 1;
  const day = parseInt(parts[3]);
  const identifier = parts[4];

  return {
    date: new Date(year, month, day),
    identifier,
    isValid: true,
  };
}

/**
 * Examples of use
 */
export const REFERENCE_EXAMPLES = {
  sequential: [
    'SAFETAP-2024-12-19-001',
    'SAFETAP-2024-12-19-002',
    'SAFETAP-2024-12-19-003',
  ],
  customer: [
    'SAFETAP-2024-12-19-JP', // Juan Pérez
    'SAFETAP-2024-12-19-MG', // María González
    'SAFETAP-2024-12-19-CR', // Carlos Rodríguez
  ],
  product: [
    'SAFETAP-2024-12-19-STK', // Sticker
    'SAFETAP-2024-12-19-KIT', // Kit completo
    'SAFETAP-2024-12-19-PRE', // Premium
  ],
};
