// Comprehensive type definitions for SafeTap
// This file contains all database-related and component types to replace 'any' usage

import { Prisma } from '@prisma/client';

// Base types from Prisma
export type User = Prisma.UserGetPayload<{
  include: {
    Sticker: true;
    Payment: true;
    EmergencyProfile: true;
  };
}>;

export type Sticker = Prisma.StickerGetPayload<{
  include: {
    User: true;
    EmergencyProfile: {
      include: {
        EmergencyContact: true;
      };
    };
    Payment: true;
  };
}>;

export type Payment = Prisma.PaymentGetPayload<{
  include: {
    User: true;
    Sticker: true;
    Promotion: true;
  };
}>;

export type EmergencyProfile = Prisma.EmergencyProfileGetPayload<{
  include: {
    User: true;
    Sticker: true;
    EmergencyContact: true;
  };
}>;

export type EmergencyContact = Prisma.EmergencyContactGetPayload<
  Record<string, never>
>;

// Insurance type based on schema validation
export interface InsuranceData {
  type: 'fonasa' | 'isapre';
  isapre?: string;
  isapreCustom?: string;
  hasComplementary: boolean;
  complementaryInsurance?: string;
}

// Emergency Contact for forms/displays
export interface EmergencyContactData {
  id?: string;
  name: string;
  relation: string;
  phone: string;
  country?: string;
  preferred: boolean;
}

// Profile display structure
export interface EmergencyProfileDisplayData {
  id: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  notes?: string | null;
  language?: string | null;
  organDonor?: boolean | null;
  insurance?: InsuranceData;
  consentPublic?: boolean | null;
  contacts: EmergencyContactData[];
  user: {
    name?: string | null;
    email?: string | null;
    country?: string | null;
  };
  sticker?: {
    slug: string;
    status: string;
    payments?: {
      id: string;
      status: string;
      amount: number;
      createdAt: Date;
    }[];
  } | null;
}

// Sticker with profile data
export interface StickerWithProfile {
  id: string;
  slug: string;
  nameOnSticker: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
  status: string;
  createdAt: string | Date;
  EmergencyProfile?: {
    id: string;
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    insurance: InsuranceData | null;
    organDonor: boolean | null;
    EmergencyContact?: EmergencyContactData[];
  } | null;
}

// User details for pages
export interface UserWithDetails {
  id: string;
  email: string;
  name?: string | null;
  country?: string | null;
  role: string;
  createdAt: Date;
  _count: {
    Sticker: number;
    Payment: number;
  };
  Payment: Array<{
    amount: number;
    createdAt: Date;
  }>;
  Sticker: Array<{
    id: string;
    status: string;
    createdAt: Date;
    slug: string;
  }>;
  EmergencyProfile?: Array<{
    id: string;
    bloodType?: string | null;
    EmergencyContact?: EmergencyContactData[];
  }>;
}

// Payment data for bank details
export interface PaymentData {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
    country: string | null;
  };
  sticker: {
    nameOnSticker: string;
    flagCode: string;
    status: string;
  } | null;
}

// Window object type for tests
export interface WindowMock {
  location: {
    origin: string;
    protocol: string;
    hostname: string;
  };
}

// Global object type for tests
export interface GlobalWithWindow {
  window?: WindowMock;
}

// Order status types for backoffice
export interface OrderStatusDisplayData {
  primaryStatus: string;
  secondaryStatuses: string[];
  description: string;
}

// Contact form data structure
export interface ContactFormData {
  id?: string;
  name: string;
  phone: string;
  relation: string;
  preferred: boolean;
}

// Error message structure
export interface ErrorMessage {
  message: string;
}

// Update data for discount API
export interface DiscountUpdateData {
  code?: string;
  type?: 'PERCENT' | 'FIXED';
  amount?: number;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  active?: boolean;
}

// Profile form data (raw from form)
export interface ProfileFormData {
  bloodType?: string;
  allergies?: string | string[];
  conditions?: string | string[];
  medications?: string | string[];
  notes?: string;
  language?: string;
  organDonor?: boolean;
  insurance?: InsuranceData;
  consentPublic?: boolean;
  contacts: ContactFormData[];
}

// Stats data for references service
export interface ReferenceStatsData {
  date: string;
  totalPayments: number;
  totalAmount: number;
  references: string[];
}
