export const PRICE_PER_STICKER_CLP = 6990;

export const DEFAULT_CURRENCY = 'CLP';

export const DEFAULT_LOCALE = 'es-CL';

export const PAYMENT_METHOD = 'BANK_TRANSFER';

// Since we now store amounts directly (not in cents), these functions are no longer needed
// but keeping them for backward compatibility if needed
export const toCents = (amount: number): number => amount * 100;
export const fromCents = (amount: number): number => amount / 100;
