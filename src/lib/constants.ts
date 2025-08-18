export const PRICE_PER_STICKER_CLP = 6990;

export const DEFAULT_CURRENCY = 'CLP';

export const DEFAULT_LOCALE = 'es-CL';

export const PAYMENT_METHOD = 'BANK_TRANSFER';

export const toCents = (amount: number): number => amount * 100;
export const fromCents = (amountCents: number): number => amountCents / 100;
