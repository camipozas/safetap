import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Create discount code schema
 * @returns - The schema object
 */
const createDiscountSchema = z.object({
  code: z.string().min(1, 'Código requerido').max(50, 'Código muy largo'),
  type: z.enum(['PERCENT', 'FIXED'], {
    errorMap: () => ({ message: 'Tipo debe ser PERCENT o FIXED' }),
  }),
  amount: z.number().min(0, 'Monto debe ser mayor a 0'),
  expiresAt: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    }),
  maxRedemptions: z.number().min(1).optional(),
  active: z.boolean().default(true),
});

/**
 * Validate discount amount based on type
 * @param data - The data object
 * @returns - The validated data object
 */
const validateDiscountAmount = (data: z.infer<typeof createDiscountSchema>) => {
  if (data.type === 'PERCENT' && data.amount > 100) {
    throw new Error('Percentage cannot be greater than 100');
  }
  if (data.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
};

/**
 * Check admin authentication
 * @returns - The response object
 */
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: 'No autorizado', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || !hasPermission(user.role, 'canAccessBackoffice')) {
    return { error: 'No autorizado', status: 403 };
  }

  return { user };
}

/**
 * GET - List discount codes with pagination
 * @param req - The request object
 * @returns - The response object
 */
export async function GET(req: Request) {
  const authResult = await checkAdminAuth();
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      prisma.discountCode.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { email: true, name: true },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      }),
      prisma.discountCode.count(),
    ]);

    return NextResponse.json({
      discounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new discount code
 * @param req - The request object
 * @returns - The response object
 */
export async function POST(req: Request) {
  const authResult = await checkAdminAuth();
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const json = await req.json();
    const data = createDiscountSchema.parse(json);

    validateDiscountAmount(data);

    const normalizedCode = data.code.trim().toUpperCase();

    const existingCode = await prisma.discountCode.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Ya existe un código con este nombre' },
        { status: 400 }
      );
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: normalizedCode,
        type: data.type,
        amount: data.amount,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxRedemptions: data.maxRedemptions,
        active: data.active,
        createdByUserId: authResult.user.id,
      },
      include: {
        createdBy: {
          select: { email: true, name: true },
        },
      },
    });

    return NextResponse.json(discountCode, { status: 201 });
  } catch (error) {
    console.error('Error creating discount:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
