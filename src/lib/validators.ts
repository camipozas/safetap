import { z } from 'zod';

export const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  relation: z.string().min(1, 'Relation required').max(40),
  phone: z.string().min(6, 'Invalid phone number').max(20),
  country: z.string().length(2).optional(),
  preferred: z.boolean().optional().default(false),
});

export const profileSchema = z.object({
  bloodType: bloodTypeEnum.optional(),
  allergies: z.array(z.string().min(1)).max(20).optional().default([]),
  conditions: z.array(z.string().min(1)).max(20).optional().default([]),
  medications: z.array(z.string().min(1)).max(20).optional().default([]),
  notes: z.string().max(500).optional(),
  language: z.string().min(2).max(5).optional(),
  organDonor: z.boolean().optional().default(false),
  insurance: z
    .object({ provider: z.string().min(1), policyNumber: z.string().min(1) })
    .optional(),
  consentPublic: z.boolean().default(true),
  contacts: z.array(emergencyContactSchema).min(1, 'At least one contact is required'),
});

export const checkoutSchema = z.object({
  nameOnSticker: z
    .string()
    .min(2, 'Minimum 2 characters')
    .max(25, 'Maximum 25 characters')
    .regex(/^[\p{L}0-9 .'-]+$/u, 'Invalid characters'),
  flagCode: z.string().length(2, 'Invalid country code'),
  stickerColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#f1f5f9'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#000000'),
  quantity: z.number().int().min(1).max(10),
});

export type ProfileInput = z.infer<typeof profileSchema>;
