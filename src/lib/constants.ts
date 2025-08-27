export const PRICE_PER_STICKER_CLP = 6990;

export const DEFAULT_CURRENCY = 'CLP';

export const DEFAULT_LOCALE = 'es-CL';

export const PAYMENT_METHOD = 'BANK_TRANSFER';

// Currency formatting helper for Chilean Pesos
export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Alternative simple formatter without currency symbol
export const formatCLPAmount = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Since we now store amounts directly (not in cents), these functions are no longer needed
// but keeping them for backward compatibility if needed
export const toCents = (amount: number): number => amount * 100;
export const fromCents = (amount: number): number => amount / 100;
