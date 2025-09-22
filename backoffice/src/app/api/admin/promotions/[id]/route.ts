import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updatePromotionSchema = z.object({
  name: z
    .string()
    .min(1, 'Nombre requerido')
    .max(100, 'Nombre muy largo')
    .optional(),
  description: z.string().max(255, 'Descripción muy larga').optional(),
  minQuantity: z
    .number()
    .min(1, 'Cantidad mínima debe ser mayor a 0')
    .optional(),
  discountType: z
    .enum(['PERCENTAGE', 'FIXED'], {
      errorMap: () => ({ message: 'Tipo debe ser PERCENTAGE o FIXED' }),
    })
    .optional(),
  discountValue: z.number().min(0, 'Valor debe ser mayor a 0').optional(),
  active: z.boolean().optional(),
  priority: z.number().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

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
 * PUT - Update promotion
 * @param req - The request object
 * @param params - The parameters object
 * @returns - The response object
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth();
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const resolvedParams = await params;
    const json = await req.json();
    const data = updatePromotionSchema.parse(json);

    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    if (data.discountType && data.discountValue) {
      if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        return NextResponse.json(
          { error: 'El porcentaje no puede ser mayor a 100' },
          { status: 400 }
        );
      }
    } else if (
      data.discountValue &&
      existingPromotion.discountType === 'PERCENTAGE' &&
      data.discountValue > 100
    ) {
      return NextResponse.json(
        { error: 'El porcentaje no puede ser mayor a 100' },
        { status: 400 }
      );
    }

    const startDate =
      data.startDate !== undefined
        ? data.startDate
          ? new Date(data.startDate)
          : null
        : existingPromotion.startDate;
    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existingPromotion.endDate;

    if (startDate && endDate && startDate >= endDate) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    if (
      data.minQuantity &&
      data.minQuantity !== existingPromotion.minQuantity
    ) {
      const conflictingPromotion = await prisma.promotion.findFirst({
        where: {
          minQuantity: data.minQuantity,
          active: true,
          id: { not: resolvedParams.id },
          AND: [
            {
              OR: [
                { startDate: null },
                { startDate: { lte: endDate || new Date() } },
              ],
            },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: startDate || new Date() } },
              ],
            },
          ],
        },
      });

      if (conflictingPromotion) {
        return NextResponse.json(
          {
            error:
              'Ya existe una promoción activa para esa cantidad mínima en el período seleccionado',
          },
          { status: 400 }
        );
      }
    }

    const updateData: {
      name?: string;
      description?: string;
      minQuantity?: number;
      discountType?: 'PERCENTAGE' | 'FIXED';
      discountValue?: number;
      active?: boolean;
      priority?: number;
      startDate?: Date | null;
      endDate?: Date | null;
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.minQuantity !== undefined)
      updateData.minQuantity = data.minQuantity;
    if (data.discountType !== undefined)
      updateData.discountType = data.discountType;
    if (data.discountValue !== undefined)
      updateData.discountValue = data.discountValue;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startDate !== undefined) updateData.startDate = startDate;
    if (data.endDate !== undefined) updateData.endDate = endDate;

    const promotion = await prisma.promotion.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    });
  } catch (error) {
    console.error('Error updating promotion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get specific promotion
 * @param req - The request object
 * @param params - The parameters object
 * @returns - The response object
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth();
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const resolvedParams = await params;
    const promotion = await prisma.promotion.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...promotion,
      discountValue: Number(promotion.discountValue),
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Soft delete (deactivate) promotion
 * @param req - The request object
 * @param params - The parameters object
 * @returns - The response object
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAdminAuth();
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const resolvedParams = await params;

    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      );
    }

    await prisma.promotion.update({
      where: { id: resolvedParams.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
