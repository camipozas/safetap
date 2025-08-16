import { describe, expect, it } from 'vitest';

import { generateSlug } from '../../src/lib/slug';

describe('Slug Generator', () => {
  describe('generateSlug', () => {
    it('generates a slug with default length of 7', () => {
      const slug = generateSlug();
      expect(slug).toHaveLength(7);
    });

    it('generates a slug with custom length', () => {
      const lengths = [3, 5, 10, 15];
      lengths.forEach((length) => {
        const slug = generateSlug(length);
        expect(slug).toHaveLength(length);
      });
    });

    it('only contains valid characters', () => {
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const slug = generateSlug(20);

      for (const char of slug) {
        expect(validChars).toContain(char);
      }
    });

    it('generates unique slugs', () => {
      const slugs = new Set();
      for (let i = 0; i < 100; i++) {
        slugs.add(generateSlug());
      }
      // Should have close to 100 unique slugs (probability of collision is very low)
      expect(slugs.size).toBeGreaterThan(95);
    });

    it('excludes ambiguous characters', () => {
      const ambiguousChars = ['0', '1', 'O', 'I']; // These are actually excluded
      const slug = generateSlug(50); // Large sample

      ambiguousChars.forEach((char) => {
        expect(slug).not.toContain(char);
      });
    });
  });
});
