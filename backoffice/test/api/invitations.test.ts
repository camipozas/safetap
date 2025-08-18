import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma BEFORE importing modules that use it
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminInvitation: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// NOW import the modules that use Prisma
import { DELETE as revokeInvitation } from '@/app/api/admin/invitations/[id]/route';
import { POST as acceptInvitation } from '@/app/api/admin/invitations/accept/route';
import {
  POST as createInvitation,
  GET as getInvitations,
} from '@/app/api/admin/invitations/route';
import { GET as validateInvitation } from '@/app/api/admin/invitations/validate/route';

// Get reference to mocked prisma and cast to MockedObject
import { prisma as _mockPrisma } from '@/lib/prisma';
const mockPrisma = _mockPrisma as any;

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock crypto
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomBytes: vi.fn(() => ({
      toString: () => 'mocked-token-123',
    })),
  };
});

describe('Invitations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set NODE_ENV to development for bypassing auth
    vi.stubEnv('NODE_ENV', 'development');
  });

  describe('GET /api/admin/invitations', () => {
    it('returns pending invitations successfully', async () => {
      const mockInvitations = [
        {
          id: 'invite-1',
          email: 'test@example.com',
          role: 'ADMIN',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: 'token-123',
          usedAt: null,
        },
      ];

      mockPrisma.adminInvitation.findMany.mockResolvedValue(mockInvitations);

      const response = await getInvitations();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invitations).toEqual(
        mockInvitations.map((inv) => ({
          ...inv,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
        }))
      );
      expect(mockPrisma.adminInvitation.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { gte: expect.any(Date) },
          usedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('handles database errors', async () => {
      mockPrisma.adminInvitation.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const response = await getInvitations();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('POST /api/admin/invitations', () => {
    it('creates invitation successfully', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'newadmin@example.com',
        role: 'ADMIN',
        token: 'mocked-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        usedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrisma.adminInvitation.findFirst.mockResolvedValue(null); // No existing invitation
      mockPrisma.adminInvitation.create.mockResolvedValue(mockInvitation);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'newadmin@example.com',
            role: 'ADMIN',
          }),
        }
      );

      const response = await createInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.invitation).toMatchObject({
        id: 'invite-1',
        email: 'newadmin@example.com',
        role: 'ADMIN',
        usedAt: null,
      });
      expect(data.invitation.createdAt).toBeDefined();
      expect(data.invitation.expiresAt).toBeDefined();
      expect(data.invitation.token).toBeDefined();
      expect(data.inviteUrl).toContain(
        'http://localhost:3002/auth/accept-invitation?token='
      );
    });

    it('rejects invalid email format', async () => {
      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: '',
            role: 'ADMIN',
          }),
        }
      );

      const response = await createInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email y rol son requeridos');
    });

    it('rejects invalid role', async () => {
      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            role: 'INVALID_ROLE',
          }),
        }
      );

      const response = await createInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Rol inválido');
    });

    it('rejects existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
      });

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'existing@example.com',
            role: 'ADMIN',
          }),
        }
      );

      const response = await createInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('El usuario ya existe en el sistema');
    });

    it('rejects duplicate invitation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.adminInvitation.findFirst.mockResolvedValue({
        id: 'existing-invite',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Future date
      });

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            role: 'ADMIN',
          }),
        }
      );

      const response = await createInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        'Ya existe una invitación pendiente para este email'
      );
    });
  });

  describe('DELETE /api/admin/invitations/[id]', () => {
    it('revokes invitation successfully', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'test@example.com',
        role: 'ADMIN',
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.adminInvitation.delete.mockResolvedValue(mockInvitation);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/invite-1',
        {
          method: 'DELETE',
        }
      );

      const response = await revokeInvitation(request, {
        params: { id: 'invite-1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('test@example.com');
    });

    it('returns 404 for non-existent invitation', async () => {
      mockPrisma.adminInvitation.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/invalid-id',
        {
          method: 'DELETE',
        }
      );

      const response = await revokeInvitation(request, {
        params: { id: 'invalid-id' },
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Invitación no encontrada');
    });
  });

  describe('GET /api/admin/invitations/validate', () => {
    it('validates invitation successfully', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'test@example.com',
        role: 'ADMIN',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        usedAt: null,
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/validate?token=valid-token'
      );

      const response = await validateInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.invitation.email).toBe('test@example.com');
    });

    it('rejects missing token', async () => {
      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/validate'
      );

      const response = await validateInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token requerido');
    });

    it('rejects invalid token', async () => {
      mockPrisma.adminInvitation.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/validate?token=invalid-token'
      );

      const response = await validateInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Token de invitación no válido');
    });

    it('rejects used invitation', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'test@example.com',
        usedAt: new Date(), // Already used
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/validate?token=used-token'
      );

      const response = await validateInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Esta invitación ya ha sido utilizada');
    });

    it('rejects expired invitation', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() - 1000), // Past date
        usedAt: null,
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/validate?token=expired-token'
      );

      const response = await validateInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Esta invitación ha expirado');
    });
  });

  describe('POST /api/admin/invitations/accept', () => {
    it('accepts invitation and creates user successfully', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'newadmin@example.com',
        role: 'ADMIN',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
      };

      const mockNewUser = {
        id: 'user-1',
        email: 'newadmin@example.com',
        role: 'ADMIN',
        name: 'newadmin',
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue(mockNewUser);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/accept',
        {
          method: 'POST',
          body: JSON.stringify({ token: 'valid-token' }),
        }
      );

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('newadmin@example.com');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('rejects missing token', async () => {
      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/accept',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token requerido');
    });

    it('rejects if user already exists', async () => {
      const mockInvitation = {
        id: 'invite-1',
        email: 'existing@example.com',
        usedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockExistingUser = {
        id: 'user-1',
        email: 'existing@example.com',
      };

      mockPrisma.adminInvitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);

      const request = new NextRequest(
        'http://localhost:3002/api/admin/invitations/accept',
        {
          method: 'POST',
          body: JSON.stringify({ token: 'valid-token' }),
        }
      );

      const response = await acceptInvitation(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('El usuario ya existe en el sistema');
    });
  });
});
