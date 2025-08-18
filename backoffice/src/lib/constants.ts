/**
 * Backoffice application constants
 */

// Pricing
export const PRICE_PER_STICKER_CLP = 6990;

// Currency
export const DEFAULT_CURRENCY = 'CLP';

// Localization
export const DEFAULT_LOCALE = 'es-CL';

// Cents conversion
export const toCents = (amount: number): number => amount * 100;
export const fromCents = (amountCents: number): number => amountCents / 100;
