import { prisma } from '@/lib/prisma';

import { generateSequentialReference } from './payment-reference';

/**
 * Servicio para gestionar referencias de pago únicas
 */
export class PaymentReferenceService {
  /**
   * Genera una referencia única para un pago
   * Verifica que no exista en la base de datos antes de retornarla
   */
  static async generateUniqueReference(
    _userId: string,
    _amount: number,
    _description?: string
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generar referencia con fecha actual + secuencial
      const date = new Date();
      const orderNumber = await this.getNextOrderNumber(date);
      const reference = generateSequentialReference(date, orderNumber);

      // Verificar que no exista en la base de datos
      const existingPayment = await prisma.payment.findUnique({
        where: { reference },
        select: { id: true },
      });

      if (!existingPayment) {
        // La referencia es única, la retornamos
        return reference;
      }

      attempts++;
    }

    // Si llegamos aquí, generamos una referencia con timestamp único
    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();
    return `SAFETAP-${timestamp}-${randomSuffix}`;
  }

  /**
   * Obtiene el siguiente número de orden para una fecha específica
   */
  private static async getNextOrderNumber(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Contar pagos creados en este día
    const paymentsToday = await prisma.payment.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return paymentsToday + 1;
  }

  /**
   * Busca un pago por su referencia
   */
  static async findByReference(reference: string) {
    return await prisma.payment.findUnique({
      where: { reference },
      include: {
        Sticker: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                country: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            country: true,
          },
        },
      },
    });
  }

  /**
   * Busca pagos por usuario
   */
  static async findByUserId(userId: string) {
    return await prisma.payment.findMany({
      where: { userId },
      include: {
        Sticker: {
          select: {
            id: true,
            slug: true,
            nameOnSticker: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Valida si una referencia existe
   */
  static async referenceExists(reference: string): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      select: { id: true },
    });
    return !!payment;
  }

  /**
   * Obtiene estadísticas de referencias por fecha
   */
  static async getReferenceStats(startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        reference: true,
        createdAt: true,
        status: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por fecha
    const statsByDate = payments.reduce(
      (acc, payment) => {
        const date = payment.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            totalPayments: 0,
            totalAmount: 0,
            references: [],
          };
        }

        acc[date].totalPayments++;
        acc[date].totalAmount += payment.amount;
        acc[date].references.push(payment.reference);

        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(statsByDate);
  }
}

/**
 * Helper para generar referencias legibles para el usuario
 */
export function generateUserFriendlyReference(
  baseReference: string,
  userName?: string,
  productName?: string
): string {
  if (userName && productName) {
    return `${baseReference} - ${userName} - ${productName}`;
  } else if (userName) {
    return `${baseReference} - ${userName}`;
  } else if (productName) {
    return `${baseReference} - ${productName}`;
  }

  return baseReference;
}

/**
 * Helper para mostrar la referencia en formato legible
 */
export function formatReferenceForDisplay(reference: string): string {
  // SAFETAP-2024-12-19-001 -> SAFETAP 2024-12-19 #001
  const parts = reference.split('-');
  if (parts.length === 5 && parts[0] === 'SAFETAP') {
    const [, year, month, day, identifier] = parts;
    return `SAFETAP ${year}-${month}-${day} #${identifier}`;
  }

  return reference;
}
