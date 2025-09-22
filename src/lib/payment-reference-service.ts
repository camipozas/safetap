import { prisma } from '@/lib/prisma';

import { generateSequentialReference } from './payment-reference';

/**
 * Service for managing unique payment references
 */
export class PaymentReferenceService {
  /**
   * Generates a unique payment reference by attempting sequential references first,
   * falling back to timestamp-based references if collisions occur
   *
   * @param _userId - User ID (currently unused, kept for interface compatibility)
   * @param _amount - Payment amount (currently unused, kept for interface compatibility)
   * @param _description - Optional payment description (currently unused)
   * @returns Promise<string> A unique payment reference
   */
  static async generateUniqueReference(
    _userId: string,
    _amount: number,
    _description?: string
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const date = new Date();
      const orderNumber = await this.getNextOrderNumber(date);
      const reference = generateSequentialReference(date, orderNumber);

      const existingPayment = await prisma.payment.findUnique({
        where: { reference },
        select: { id: true },
      });

      if (!existingPayment) {
        return reference;
      }

      attempts++;
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();
    return `SAFETAP-${timestamp}-${randomSuffix}`;
  }

  /**
   * Gets the next order number for a specific date
   *
   * @param date - The date to get the next order number for
   * @returns Promise<number> The next sequential order number for the given date
   */
  private static async getNextOrderNumber(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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
   * Finds a payment by its reference
   *
   * @param reference - The payment reference to search for
   * @returns Promise with payment data including related sticker and user information
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
   * Finds payments by user ID
   *
   * @param userId - The user ID to search payments for
   * @returns Promise with array of payments including related sticker information
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
   * Validates if a payment reference exists
   *
   * @param reference - The payment reference to validate
   * @returns Promise<boolean> True if the reference exists, false otherwise
   */
  static async referenceExists(reference: string): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
      where: { reference },
      select: { id: true },
    });
    return !!payment;
  }

  /**
   * Gets payment reference statistics by date range
   *
   * @param startDate - Start date for the statistics range
   * @param endDate - End date for the statistics range
   * @returns Promise with array of daily statistics including payments count and total amounts
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
      {} as Record<
        string,
        {
          date: string;
          totalPayments: number;
          totalAmount: number;
          references: string[];
        }
      >
    );

    return Object.values(statsByDate);
  }
}

/**
 * Helper function to generate user-friendly payment references
 *
 * @param baseReference - The base payment reference
 * @param userName - Optional user name to include in the reference
 * @param productName - Optional product name to include in the reference
 * @returns Formatted user-friendly reference string
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
 * Helper function to format payment reference for display
 * Formats SAFETAP-2024-12-19-001 -> SAFETAP 2024-12-19 #001
 *
 * @param reference - The payment reference to format
 * @returns Formatted reference string for display
 */
export function formatReferenceForDisplay(reference: string): string {
  const parts = reference.split('-');
  if (parts.length === 5 && parts[0] === 'SAFETAP') {
    const [, year, month, day, identifier] = parts;
    return `SAFETAP ${year}-${month}-${day} #${identifier}`;
  }

  return reference;
}
