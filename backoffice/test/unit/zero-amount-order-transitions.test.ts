import { describe, expect, test } from 'vitest';

import {
  ORDER_STATUS,
  PaymentInfo,
  getAvailableStatusTransitions,
  isValidStatusTransition,
} from '@/lib/order-helpers';

describe('Zero Amount Order Transitions', () => {
  describe('isValidStatusTransition for zero amount transactions', () => {
    const createZeroAmountPaymentInfo = (): PaymentInfo => ({
      totalAmount: 0,
      currency: 'CLP',
      hasConfirmedPayment: false,
      hasPendingPayment: false,
      hasRejectedPayment: false,
      latestStatus: null,
      paymentCount: 1,
    });

    const createNonZeroAmountPaymentInfo = (): PaymentInfo => ({
      totalAmount: 6990,
      currency: 'CLP',
      hasConfirmedPayment: true,
      hasPendingPayment: false,
      hasRejectedPayment: false,
      latestStatus: 'PAID',
      paymentCount: 1,
    });

    test('should allow direct transition from ORDERED to PRINTING for zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(true);
    });

    test('should not allow direct transition from ORDERED to PRINTING for non-zero amount', () => {
      const paymentInfo = createNonZeroAmountPaymentInfo();
      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(false);
    });

    test('should still allow ORDERED to PAID transition for zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PAID,
          paymentInfo
        )
      ).toBe(true);
    });

    test('should allow ORDERED to LOST transition for zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.LOST,
          paymentInfo
        )
      ).toBe(true);
    });

    test('should not allow invalid transitions for zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.SHIPPED,
          paymentInfo
        )
      ).toBe(false);
    });
  });

  describe('getAvailableStatusTransitions for zero amount transactions', () => {
    const createZeroAmountPaymentInfo = (): PaymentInfo => ({
      totalAmount: 0,
      currency: 'CLP',
      hasConfirmedPayment: false,
      hasPendingPayment: false,
      hasRejectedPayment: false,
      latestStatus: null,
      paymentCount: 1,
    });

    test('should include PRINTING transition for ORDERED status with zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      const transitions = getAvailableStatusTransitions(
        ORDER_STATUS.ORDERED,
        paymentInfo
      );

      const printingTransition = transitions.find(
        (t) => t.status === ORDER_STATUS.PRINTING
      );
      expect(printingTransition).toBeDefined();
      expect(printingTransition?.description).toBe(
        'Iniciar impresión (para transacciones sin costo)'
      );
    });

    test('should include all standard transitions for ORDERED status with zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      const transitions = getAvailableStatusTransitions(
        ORDER_STATUS.ORDERED,
        paymentInfo
      );

      expect(transitions).toHaveLength(4); // PAID, PRINTING, REJECTED, LOST
      expect(
        transitions.find((t) => t.status === ORDER_STATUS.PAID)
      ).toBeDefined();
      expect(
        transitions.find((t) => t.status === ORDER_STATUS.PRINTING)
      ).toBeDefined();
      expect(
        transitions.find((t) => t.status === ORDER_STATUS.REJECTED)
      ).toBeDefined();
      expect(
        transitions.find((t) => t.status === ORDER_STATUS.LOST)
      ).toBeDefined();
    });

    test('should filter out invalid transitions for zero amount', () => {
      const paymentInfo = createZeroAmountPaymentInfo();
      const transitions = getAvailableStatusTransitions(
        ORDER_STATUS.ORDERED,
        paymentInfo
      );

      expect(
        transitions.find((t) => t.status === ORDER_STATUS.SHIPPED)
      ).toBeUndefined();
      expect(
        transitions.find((t) => t.status === ORDER_STATUS.ACTIVE)
      ).toBeUndefined();
    });
  });

  describe('Edge cases for zero amount transactions', () => {
    test('should handle zero amount with confirmed payment', () => {
      const paymentInfo: PaymentInfo = {
        totalAmount: 0,
        currency: 'CLP',
        hasConfirmedPayment: true,
        hasPendingPayment: false,
        hasRejectedPayment: false,
        latestStatus: 'PAID',
        paymentCount: 1,
      };

      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(true);
    });

    test('should handle zero amount with pending payment', () => {
      const paymentInfo: PaymentInfo = {
        totalAmount: 0,
        currency: 'CLP',
        hasConfirmedPayment: false,
        hasPendingPayment: true,
        hasRejectedPayment: false,
        latestStatus: 'PENDING',
        paymentCount: 1,
      };

      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(true);
    });

    test('should handle zero amount with rejected payment', () => {
      const paymentInfo: PaymentInfo = {
        totalAmount: 0,
        currency: 'CLP',
        hasConfirmedPayment: false,
        hasPendingPayment: false,
        hasRejectedPayment: true,
        latestStatus: 'REJECTED',
        paymentCount: 1,
      };

      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(true);
    });
  });

  describe('Non-zero amount transactions should not have direct PRINTING transition', () => {
    test('should not allow direct ORDERED to PRINTING for non-zero amount', () => {
      const paymentInfo: PaymentInfo = {
        totalAmount: 6990,
        currency: 'CLP',
        hasConfirmedPayment: true,
        hasPendingPayment: false,
        hasRejectedPayment: false,
        latestStatus: 'PAID',
        paymentCount: 1,
      };

      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(false);
    });

    test('should require PAID status before PRINTING for non-zero amount', () => {
      const paymentInfo: PaymentInfo = {
        totalAmount: 6990,
        currency: 'CLP',
        hasConfirmedPayment: true,
        hasPendingPayment: false,
        hasRejectedPayment: false,
        latestStatus: 'PAID',
        paymentCount: 1,
      };

      expect(
        isValidStatusTransition(
          ORDER_STATUS.ORDERED,
          ORDER_STATUS.PAID,
          paymentInfo
        )
      ).toBe(true);

      expect(
        isValidStatusTransition(
          ORDER_STATUS.PAID,
          ORDER_STATUS.PRINTING,
          paymentInfo
        )
      ).toBe(true);
    });
  });
});
