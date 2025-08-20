import { vi } from 'vitest';

// Mock data for emergency profile
export const mockEmergencyProfile = {
  id: 'mock-profile-id',
  userId: 'mock-user-id',
  stickerId: 'mock-sticker-id',
  bloodType: 'O+',
  allergies: ['Penicilina', 'Mariscos', 'Frutos secos'],
  conditions: ['Diabetes Tipo 1', 'Asma'],
  medications: ['Insulina Lantus', 'Inhalador Salbutamol'],
  notes:
    'Diabética tipo 1 desde los 12 años. Requiere glucagón en caso de hipoglucemia severa.',
  language: 'es',
  organDonor: true,
  consentPublic: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  user: {
    id: 'mock-user-id',
    name: 'María González',
    email: 'demo@safetap.cl',
    country: 'CL',
  },
  sticker: {
    id: 'mock-sticker-id',
    slug: 'demo-chile',
    serial: 'DEMO001',
    nameOnSticker: 'María González',
    flagCode: 'CL',
    status: 'ACTIVE',
    colorPresetId: 'light-gray',
    stickerColor: '#f1f5f9',
    textColor: '#000000',
    payments: [
      {
        id: 'mock-payment-id',
        status: 'PAID',
        amountCents: 2500000,
        currency: 'CLP',
        reference: 'DEMO-PAYMENT',
        receivedAt: new Date('2023-01-01'),
      },
    ],
  },
  contacts: [
    {
      id: 'mock-contact-1',
      name: 'Carlos González',
      relation: 'Esposo',
      phone: '+56912345678',
      country: 'Chile',
      preferred: true,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'mock-contact-2',
      name: 'Ana González',
      relation: 'Hija',
      phone: '+56987654321',
      country: 'Chile',
      preferred: false,
      createdAt: new Date('2023-01-01'),
    },
  ],
};

// Mock Prisma client
export const mockPrismaClient = {
  emergencyProfile: {
    findFirst: vi.fn().mockResolvedValue(mockEmergencyProfile),
    findMany: vi.fn().mockResolvedValue([mockEmergencyProfile]),
    create: vi.fn().mockResolvedValue(mockEmergencyProfile),
    update: vi.fn().mockResolvedValue(mockEmergencyProfile),
    upsert: vi.fn().mockResolvedValue(mockEmergencyProfile),
  },
  user: {
    findFirst: vi.fn().mockResolvedValue(mockEmergencyProfile.user),
    findMany: vi.fn().mockResolvedValue([mockEmergencyProfile.user]),
    create: vi.fn().mockResolvedValue(mockEmergencyProfile.user),
    update: vi.fn().mockResolvedValue(mockEmergencyProfile.user),
    upsert: vi.fn().mockResolvedValue(mockEmergencyProfile.user),
  },
  sticker: {
    findFirst: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker),
    findMany: vi.fn().mockResolvedValue([mockEmergencyProfile.sticker]),
    create: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker),
    update: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker),
    upsert: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker),
  },
  payment: {
    findFirst: vi
      .fn()
      .mockResolvedValue(mockEmergencyProfile.sticker.payments[0]),
    findMany: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker.payments),
    create: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker.payments[0]),
    update: vi.fn().mockResolvedValue(mockEmergencyProfile.sticker.payments[0]),
  },
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

export default mockPrismaClient;
