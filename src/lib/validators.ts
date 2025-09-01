import { z } from 'zod';

import { isValidColorPreset } from './color-presets';

export const bloodTypeEnum = z.enum([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  relation: z.string().min(1, 'Relation required').max(40),
  phone: z.string().min(6, 'Invalid phone number').max(20),
  country: z.string().length(2).optional(),
  preferred: z.boolean().optional().default(false),
});

export const profileSchema = z.object({
  bloodType: bloodTypeEnum.optional(),
  allergies: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  conditions: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  medications: z
    .string()
    .optional()
    .default('')
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  notes: z.string().max(500).optional(),
  language: z.string().min(2).max(5).optional(),
  organDonor: z.boolean().optional().default(false),
  insurance: z
    .object({
      type: z.enum(['fonasa', 'isapre']),
      isapre: z.string().optional(),
      isapreCustom: z.string().optional(),
      hasComplementary: z.boolean().default(false),
      complementaryInsurance: z.string().optional(),
    })
    .refine(
      (data) => {
        // Si es Isapre, debe especificar cuál (ya sea del dropdown o custom)
        if (data.type === 'isapre' && !data.isapre && !data.isapreCustom) {
          return false;
        }
        // Si tiene seguro complementario, debe especificar cuál
        if (data.hasComplementary && !data.complementaryInsurance) {
          return false;
        }
        return true;
      },
      {
        message: 'Debe completar toda la información de salud previsional',
      }
    )
    .optional(),
  consentPublic: z.boolean().default(true),
  contacts: z
    .array(emergencyContactSchema)
    .min(1, 'At least one contact is required'),
});

// Form input type for client-side forms (before transformation)
export const profileFormSchema = z.object({
  bloodType: bloodTypeEnum.optional(),
  allergies: z.string().optional().default(''),
  conditions: z.string().optional().default(''),
  medications: z.string().optional().default(''),
  notes: z.string().max(500).optional(),
  language: z.string().min(2).max(5).optional(),
  organDonor: z.boolean().optional().default(false),
  insurance: z
    .object({
      type: z.enum(['fonasa', 'isapre']),
      isapre: z.string().optional(),
      isapreCustom: z.string().optional(),
      hasComplementary: z.boolean().default(false),
      complementaryInsurance: z.string().optional(),
    })
    .refine(
      (data) => {
        // Si es Isapre, debe especificar cuál (ya sea del dropdown o custom)
        if (data.type === 'isapre' && !data.isapre && !data.isapreCustom) {
          return false;
        }
        // Si tiene seguro complementario, debe especificar cuál
        if (data.hasComplementary && !data.complementaryInsurance) {
          return false;
        }
        return true;
      },
      {
        message: 'Debe completar toda la información de salud previsional',
      }
    )
    .optional(),
  consentPublic: z.boolean().default(true),
  contacts: z
    .array(emergencyContactSchema)
    .min(1, 'At least one contact is required'),
});

export const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  nameOnSticker: z
    .string()
    .min(2, 'Minimum 2 characters')
    .max(25, 'Maximum 25 characters')
    .regex(/^[\p{L}0-9 .'-]+$/u, 'Invalid characters'),
  flagCode: z.string().length(2, 'Invalid country code'),
  colorPresetId: z
    .string()
    .refine(isValidColorPreset, 'Invalid color preset')
    .optional()
    .default('light-gray'),
  stickerColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional()
    .default('#f1f5f9'),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional()
    .default('#000000'),
  quantity: z.number().int().min(1).max(10),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;
