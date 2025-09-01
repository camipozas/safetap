import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/types/shared';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateDiscountSchema = z.object({
  code: z
    .string()
    .min(1, 'Código requerido')
    .max(50, 'Código muy largo')
    .optional(),
  type: z
    .enum(['PERCENT', 'FIXED'], {
      errorMap: () => ({ message: 'Tipo debe ser PERCENT o FIXED' }),
    })
    .optional(),
  amount: z.number().min(0, 'Monto debe ser mayor a 0').optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxRedemptions: z.number().min(1).nullable().optional(),
  active: z.boolean().optional(),
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

// PUT /api/discounts/[id] - Update discount code
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
    const data = updateDiscountSchema.parse(json);

    // Check if discount exists
    const existingDiscount = await prisma.discountCode.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Código de descuento no encontrado' },
        { status: 404 }
      );
    }

    // Validate amount based on type if both are provided
    if (data.type && data.amount) {
      if (data.type === 'PERCENT' && data.amount > 100) {
        return NextResponse.json(
          { error: 'El porcentaje no puede ser mayor a 100' },
          { status: 400 }
        );
      }
    } else if (
      data.amount &&
      existingDiscount.type === 'PERCENT' &&
      data.amount > 100
    ) {
      return NextResponse.json(
        { error: 'El porcentaje no puede ser mayor a 100' },
        { status: 400 }
      );
    }

    // If updating code, check for uniqueness
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      const codeExists = await prisma.discountCode.findFirst({
        where: {
          code: normalizedCode,
          id: { not: resolvedParams.id },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Ya existe un código con este nombre' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data.code) {
      updateData.code = data.code.trim().toUpperCase();
    }
    if (data.type) {
      updateData.type = data.type;
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.maxRedemptions !== undefined) {
      updateData.maxRedemptions = data.maxRedemptions;
    }
    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    const discountCode = await prisma.discountCode.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        createdBy: {
          select: { email: true, name: true },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Error updating discount:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/discounts/[id] - Get specific discount code
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
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: resolvedParams.id },
      include: {
        createdBy: {
          select: { email: true, name: true },
        },
        _count: {
          select: { redemptions: true },
        },
        redemptions: {
          take: 10,
          orderBy: { redeemedAt: 'desc' },
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Código de descuento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(discountCode);
  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/discounts/[id] - Soft delete (deactivate) discount code
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

    // Check if discount exists
    const existingDiscount = await prisma.discountCode.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Código de descuento no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete by deactivating
    await prisma.discountCode.update({
      where: { id: resolvedParams.id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Código de descuento desactivado' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
