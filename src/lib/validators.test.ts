import { describe, it, expect } from 'vitest';
import { profileSchema } from './validators';

describe('profileSchema', () => {
  it('requires at least one contact', () => {
    const res = profileSchema.safeParse({ contacts: [] });
    expect(res.success).toBe(false);
  });
  it('accepts a valid profile', () => {
    const res = profileSchema.safeParse({
      bloodType: 'O+',
      contacts: [{ name: 'Ana', relation: 'Madre', phone: '600123123', preferred: true }],
    });
    expect(res.success).toBe(true);
  });
});
