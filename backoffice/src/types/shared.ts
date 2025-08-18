// Centralized types for SafeTap
// This file exports shared types used across the application
import { AccessVia, PaymentStatus, Role, StickerStatus } from '@prisma/client';

export { AccessVia, PaymentStatus, Role, StickerStatus };

// User roles with descriptions
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Role labels for UI
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.USER]: 'Usuario',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: {
    canAccessApp: true,
    canAccessBackoffice: false,
    canManageUsers: false,
    canManageOrders: false,
    canManageAdmins: false,
  },
  [USER_ROLES.ADMIN]: {
    canAccessApp: true,
    canAccessBackoffice: true,
    canManageUsers: true,
    canManageOrders: true,
    canManageAdmins: false,
  },
  [USER_ROLES.SUPER_ADMIN]: {
    canAccessApp: true,
    canAccessBackoffice: true,
    canManageUsers: true,
    canManageOrders: true,
    canManageAdmins: true,
  },
} as const;

export type RolePermissions =
  keyof (typeof ROLE_PERMISSIONS)[typeof USER_ROLES.USER];

export const hasPermission = (
  role: UserRole,
  permission: RolePermissions
): boolean => {
  return ROLE_PERMISSIONS[role as UserRole]?.[permission] ?? false;
};

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
