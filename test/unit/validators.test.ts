import { describe, expect, it } from 'vitest';

import { profileSchema } from '../../src/lib/validators';

describe('Validators', () => {
  describe('profileSchema', () => {
    it('requires at least one contact', () => {
      const res = profileSchema.safeParse({ contacts: [] });
      expect(res.success).toBe(false);
    });

    it('accepts a valid profile', () => {
      const res = profileSchema.safeParse({
        bloodType: 'O+',
        contacts: [
          {
            name: 'Ana',
            relation: 'Madre',
            phone: '600123123',
            preferred: true,
          },
        ],
      });
      expect(res.success).toBe(true);
    });

    it('validates blood type format', () => {
      const validBloodTypes = [
        'A+',
        'A-',
        'B+',
        'B-',
        'AB+',
        'AB-',
        'O+',
        'O-',
      ];

      validBloodTypes.forEach((bloodType) => {
        const res = profileSchema.safeParse({
          bloodType,
          contacts: [
            {
              name: 'Test',
              relation: 'Padre',
              phone: '600123123',
              preferred: true,
            },
          ],
        });
        expect(res.success).toBe(true);
      });
    });

    it('rejects invalid blood type', () => {
      const res = profileSchema.safeParse({
        bloodType: 'Z+',
        contacts: [
          {
            name: 'Test',
            relation: 'Padre',
            phone: '600123123',
            preferred: true,
          },
        ],
      });
      expect(res.success).toBe(false);
    });

    it('validates contact phone format', () => {
      const res = profileSchema.safeParse({
        bloodType: 'O+',
        contacts: [
          { name: 'Test', relation: 'Padre', phone: '12345', preferred: true }, // Too short
        ],
      });
      expect(res.success).toBe(false);
    });

    it('accepts contact without preferred field', () => {
      const res = profileSchema.safeParse({
        bloodType: 'O+',
        contacts: [
          { name: 'Test1', relation: 'Padre', phone: '600123123' }, // No preferred field
          { name: 'Test2', relation: 'Madre', phone: '600123124' },
        ],
      });
      expect(res.success).toBe(true);
    });
  });
});
