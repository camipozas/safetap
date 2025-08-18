import { describe, expect, it } from 'vitest';

describe('Checkout Pricing', () => {
  describe('CLP pricing calculations', () => {
    const PRICE_PER_STICKER_CLP = 6990;
    const PRICE_PER_STICKER_CENTS = 699000;

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
      const amountCents = PRICE_PER_STICKER_CENTS * quantity;
      expect(amountCents).toBe(699000);
    });

    it('calculates correct amount in cents for multiple stickers', () => {
      const quantity = 2;
      const amountCents = PRICE_PER_STICKER_CENTS * quantity;
      expect(amountCents).toBe(1398000);
    });

    it('formats CLP currency correctly', () => {
      const amount = 6990;
      const formatted = amount.toLocaleString('es-CL');
      expect(formatted).toBe('6.990');
    });

    it('formats large CLP amounts correctly', () => {
      const amount = 20970;
      const formatted = amount.toLocaleString('es-CL');
      expect(formatted).toBe('20.970');
    });
  });

  describe('Currency conversion from cents', () => {
    it('converts cents to CLP correctly', () => {
      const amountCents = 699000;
      const clp = amountCents / 100;
      expect(clp).toBe(6990);
    });

    it('converts large amounts from cents to CLP correctly', () => {
      const amountCents = 1398000;
      const clp = amountCents / 100;
      expect(clp).toBe(13980);
    });
  });
});
