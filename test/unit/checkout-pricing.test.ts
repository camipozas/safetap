import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  PRICE_PER_STICKER_CLP,
  fromCents,
  toCents,
} from '@/lib/constants';

describe('Checkout Pricing', () => {
  describe('CLP pricing calculations', () => {
    const PRICE_PER_STICKER_CENTS = toCents(PRICE_PER_STICKER_CLP);

    it('calculates correct total for single sticker', () => {
      const quantity = 1;
      const total = quantity * PRICE_PER_STICKER_CLP;
      expect(total).toBe(6990);
    });

    it('calculates correct total for multiple stickers', () => {
      const quantity = 3;
      const total = quantity * PRICE_PER_STICKER_CLP;
      expect(total).toBe(20970);
    });

    it('calculates correct amount in cents for API', () => {
      const quantity = 1;
      const amount = PRICE_PER_STICKER_CENTS * quantity;
      expect(amount).toBe(toCents(PRICE_PER_STICKER_CLP));
    });

    it('calculates correct amount in cents for multiple stickers', () => {
      const quantity = 2;
      const amount = PRICE_PER_STICKER_CENTS * quantity;
      expect(amount).toBe(toCents(PRICE_PER_STICKER_CLP) * 2);
    });

    it('formats CLP currency correctly', () => {
      const formatted = PRICE_PER_STICKER_CLP.toLocaleString(DEFAULT_LOCALE);
      expect(formatted).toBe('6.990');
    });

    it('formats large CLP amounts correctly', () => {
      const amount = PRICE_PER_STICKER_CLP * 3;
      const formatted = amount.toLocaleString(DEFAULT_LOCALE);
      expect(formatted).toBe('20.970');
    });
  });

  describe('Currency conversion from cents', () => {
    it('converts cents to CLP correctly', () => {
      const amount = toCents(PRICE_PER_STICKER_CLP);
      const clp = fromCents(amount);
      expect(clp).toBe(PRICE_PER_STICKER_CLP);
    });

    it('converts large amounts from cents to CLP correctly', () => {
      const amount = toCents(PRICE_PER_STICKER_CLP * 2);
      const clp = fromCents(amount);
      expect(clp).toBe(PRICE_PER_STICKER_CLP * 2);
    });
  });
});
