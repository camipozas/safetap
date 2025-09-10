import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createPromotionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100, 'Nombre muy largo'),
  description: z.string().max(255, 'Descripción muy larga').optional(),
  minQuantity: z.number().min(1, 'Cantidad mínima debe ser mayor a 0'),
  discountType: z.enum(['PERCENTAGE', 'FIXED'], {
    errorMap: () => ({ message: 'Tipo debe ser PERCENTAGE o FIXED' }),
  }),
  discountValue: z.number().min(0, 'Valor debe ser mayor a 0'),
  active: z.boolean().default(true),
  priority: z.number().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const validatePromotionData = (data: z.infer<typeof createPromotionSchema>) => {
  if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
    throw new Error('El porcentaje no puede ser mayor a 100');
  }
  if (data.discountValue <= 0) {
    throw new Error('El valor debe ser mayor a 0');
  }
  if (
    data.startDate &&
    data.endDate &&
    new Date(data.startDate) >= new Date(data.endDate)
  ) {
    throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
  }
};

/**
 * Check if the user is authenticated and has backoffice access
 * @returns NextResponse with user info or error if not authorized
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

/** List promotions with pagination
 * @param req Request object with optional page and limit query params
 * @returns NextResponse with paginated promotions or error
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

    const [promotions, total] = await Promise.all([
      prisma.promotion.findMany({
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { minQuantity: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.promotion.count(),
    ]);

    return NextResponse.json({
      promotions: promotions.map((promo) => ({
        ...promo,
        discountValue: Number(promo.discountValue),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Create a new promotion
 * @param req Request object with promotion data in JSON body
 * @returns NextResponse with created promotion or error
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
    const data = createPromotionSchema.parse(json);

    validatePromotionData(data);

    const existingPromotion = await prisma.promotion.findFirst({
      where: {
        minQuantity: data.minQuantity,
        active: true,
        AND: [
          {
            OR: [
              { startDate: null },
              {
                startDate: {
                  lte: data.endDate ? new Date(data.endDate) : new Date(),
                },
              },
            ],
          },
          {
            OR: [
              { endDate: null },
              {
                endDate: {
                  gte: data.startDate ? new Date(data.startDate) : new Date(),
                },
              },
            ],
          },
        ],
      },
    });

    if (existingPromotion) {
      return NextResponse.json(
        {
          error:
            'Ya existe una promoción activa para esa cantidad mínima en el período seleccionado',
        },
        { status: 400 }
      );
    }

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description,
        minQuantity: data.minQuantity,
        discountType: data.discountType,
        discountValue: data.discountValue,
        active: data.active,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    });
  } catch (error) {
    console.error('Error creating promotion:', error);

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
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
