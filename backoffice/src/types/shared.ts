// Centralized types for SafeTap
// This file exports shared types used across the application
export { AccessVia, PaymentStatus, Role, StickerStatus } from '@prisma/client';

// User roles with descriptions
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const ROLE_PERMISSIONS = {
  USER: {
    canAccessApp: true,
    canAccessBackoffice: false,
    canManageUsers: false,
    canManageOrders: false,
    canManageAdmins: false,
  },
  ADMIN: {
    canAccessApp: true,
    canAccessBackoffice: true,
    canManageUsers: true,
    canManageOrders: true,
    canManageAdmins: false,
  },
  SUPER_ADMIN: {
    canAccessApp: true,
    canAccessBackoffice: true,
    canManageUsers: true,
    canManageOrders: true,
    canManageAdmins: true,
  },
} as const;

export const STICKER_STATUS_FLOW = {
  ORDERED: 'PAID',
  PAID: 'PRINTING',
  PRINTING: 'SHIPPED',
  SHIPPED: 'ACTIVE',
} as const;

export const STATUS_LABELS = {
  ORDERED: '📝 Creada',
  PAID: '💰 Pagada',
  PRINTING: '🖨️ Imprimiendo',
  SHIPPED: '📦 Enviada',
  ACTIVE: '✅ Activa',
  LOST: '❌ Perdida',
} as const;

export const STATUS_COLORS = {
  ORDERED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-purple-100 text-purple-800',
  PRINTING: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
} as const;

export const isAdmin = (role: string): boolean =>
  role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;

export const isSuperAdmin = (role: string): boolean =>
  role === USER_ROLES.SUPER_ADMIN;

export const canAccessBackoffice = (role: string): boolean => isAdmin(role);

export const canManageAdmins = (role: string): boolean => isSuperAdmin(role);
