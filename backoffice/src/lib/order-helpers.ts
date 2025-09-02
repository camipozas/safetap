import { Order } from '@/types/dashboard';

// Order status constants
export const ORDER_STATUS = {
  ORDERED: 'ORDERED',
  PAID: 'PAID',
  PRINTING: 'PRINTING',
  SHIPPED: 'SHIPPED',
  ACTIVE: 'ACTIVE',
  LOST: 'LOST',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

// Transition direction constants
export const TRANSITION_DIRECTION = {
  FORWARD: 'forward',
  BACKWARD: 'backward',
  SPECIAL: 'special',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type TransitionDirection =
  (typeof TRANSITION_DIRECTION)[keyof typeof TRANSITION_DIRECTION];

export interface OrderStatusTransition {
  status: OrderStatus;
  direction: TransitionDirection;
  requiresPayment: boolean;
  description: string;
}

export interface PaymentInfo {
  totalAmount: number;
  currency: string;
  hasConfirmedPayment: boolean;
  hasPendingPayment: boolean;
  hasRejectedPayment: boolean;
  latestStatus: PaymentStatus | null;
  paymentCount: number;
}

/**
 * Analyzes payment information for an order
 */
export function analyzePayments(payments: Order['payments']): PaymentInfo {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const currency = payments[0]?.currency || 'EUR';

  const confirmedStatuses: PaymentStatus[] = [
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.VERIFIED,
  ];

  const hasConfirmedPayment = payments.some((p) =>
    confirmedStatuses.includes(p.status as PaymentStatus)
  );

  const hasPendingPayment = payments.some(
    (p) => p.status === PAYMENT_STATUS.PENDING
  );

  const hasRejectedPayment = payments.some(
    (p) => p.status === PAYMENT_STATUS.REJECTED
  );

  const latestPayment = payments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return {
    totalAmount,
    currency,
    hasConfirmedPayment,
    hasPendingPayment,
    hasRejectedPayment,
    latestStatus: (latestPayment?.status as PaymentStatus) || null,
    paymentCount: payments.length,
  };
}

/**
 * Synchronizes payment statuses when order status changes
 * This ensures consistency between order and payment states
 */
export function getPaymentStatusForOrderStatus(
  orderStatus: OrderStatus
): PaymentStatus | null {
  switch (orderStatus) {
    case ORDER_STATUS.ORDERED:
      return PAYMENT_STATUS.PENDING;
    case ORDER_STATUS.PAID:
      return PAYMENT_STATUS.VERIFIED;
    case ORDER_STATUS.PRINTING:
      return PAYMENT_STATUS.PAID;
    case ORDER_STATUS.SHIPPED:
      return PAYMENT_STATUS.PAID;
    case ORDER_STATUS.ACTIVE:
      return PAYMENT_STATUS.PAID;
    case ORDER_STATUS.REJECTED:
      return PAYMENT_STATUS.REJECTED;
    case ORDER_STATUS.CANCELLED:
      return PAYMENT_STATUS.CANCELLED;
    case ORDER_STATUS.LOST:
      return PAYMENT_STATUS.PAID; // Keep payment as paid even if sticker is lost
    default:
      return null;
  }
}

/**
 * Determines if a status transition is valid based on current status and payment info
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  paymentInfo: PaymentInfo
): boolean {
  // Special case: REJECTED is handled differently (affects payment, not sticker status)
  if (newStatus === ORDER_STATUS.REJECTED) {
    // Can reject from ORDERED or PAID states
    return (
      currentStatus === ORDER_STATUS.ORDERED ||
      currentStatus === ORDER_STATUS.PAID
    );
  }

  // Business rules for status transitions
  switch (currentStatus) {
    case ORDER_STATUS.ORDERED:
      // Can move to PAID (payment will be created if needed)
      if (newStatus === ORDER_STATUS.PAID) return true;
      // Can move to LOST anytime
      if (newStatus === ORDER_STATUS.LOST) return true;
      return false;

    case ORDER_STATUS.PAID:
      // Can move to PRINTING only if there's a confirmed payment
      if (newStatus === ORDER_STATUS.PRINTING)
        return paymentInfo.hasConfirmedPayment;
      // Can go back to ORDERED
      if (newStatus === ORDER_STATUS.ORDERED) return true;
      // Can move to LOST anytime
      if (newStatus === ORDER_STATUS.LOST) return true;
      return false;

    case ORDER_STATUS.PRINTING:
      // Can move to SHIPPED only if there's a confirmed payment
      if (newStatus === ORDER_STATUS.SHIPPED)
        return paymentInfo.hasConfirmedPayment;
      // Can go back to PAID
      if (newStatus === ORDER_STATUS.PAID) return true;
      // Can move to LOST anytime
      if (newStatus === ORDER_STATUS.LOST) return true;
      return false;

    case ORDER_STATUS.SHIPPED:
      // Can move to ACTIVE only if there's a confirmed payment and NO pending payments
      if (newStatus === ORDER_STATUS.ACTIVE)
        return (
          paymentInfo.hasConfirmedPayment && !paymentInfo.hasPendingPayment
        );
      // Can go back to PRINTING
      if (newStatus === ORDER_STATUS.PRINTING) return true;
      // Can move to LOST anytime
      if (newStatus === ORDER_STATUS.LOST) return true;
      return false;

    case ORDER_STATUS.ACTIVE:
      // Can only move to LOST or go back to SHIPPED
      if (newStatus === ORDER_STATUS.LOST) return true;
      if (newStatus === ORDER_STATUS.SHIPPED) return true;
      return false;

    case ORDER_STATUS.LOST:
      // Can restart the process by going back to ORDERED
      if (newStatus === ORDER_STATUS.ORDERED) return true;
      return false;

    case ORDER_STATUS.REJECTED:
      // Can retry payment by going back to ORDERED
      if (newStatus === ORDER_STATUS.ORDERED) return true;
      // Can cancel the order
      if (newStatus === ORDER_STATUS.CANCELLED) return true;
      return false;

    case ORDER_STATUS.CANCELLED:
      // Can restart the process by going back to ORDERED
      if (newStatus === ORDER_STATUS.ORDERED) return true;
      return false;

    default:
      return false;
  }
}

/**
 * Gets available status transitions for an order
 */
export function getAvailableStatusTransitions(
  currentStatus: OrderStatus,
  paymentInfo: PaymentInfo
): OrderStatusTransition[] {
  const allTransitions: Record<OrderStatus, OrderStatusTransition[]> = {
    [ORDER_STATUS.ORDERED]: [
      {
        status: ORDER_STATUS.PAID,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: true,
        description: 'Marcar como pagada (requiere pago confirmado)',
      },
      {
        status: ORDER_STATUS.REJECTED,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como rechazada (pago rechazado)',
      },
      {
        status: ORDER_STATUS.LOST,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como perdida',
      },
    ],
    [ORDER_STATUS.PAID]: [
      {
        status: ORDER_STATUS.PRINTING,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Iniciar impresión',
      },
      {
        status: ORDER_STATUS.ORDERED,
        direction: TRANSITION_DIRECTION.BACKWARD,
        requiresPayment: false,
        description: 'Volver a creada',
      },
      {
        status: ORDER_STATUS.LOST,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como perdida',
      },
    ],
    [ORDER_STATUS.PRINTING]: [
      {
        status: ORDER_STATUS.SHIPPED,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Marcar como enviada',
      },
      {
        status: ORDER_STATUS.PAID,
        direction: TRANSITION_DIRECTION.BACKWARD,
        requiresPayment: false,
        description: 'Volver a pagada',
      },
      {
        status: ORDER_STATUS.LOST,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como perdida',
      },
    ],
    [ORDER_STATUS.SHIPPED]: [
      {
        status: ORDER_STATUS.ACTIVE,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Marcar como activa (sin pagos pendientes)',
      },
      {
        status: ORDER_STATUS.PRINTING,
        direction: TRANSITION_DIRECTION.BACKWARD,
        requiresPayment: false,
        description: 'Volver a imprimiendo',
      },
      {
        status: ORDER_STATUS.LOST,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como perdida',
      },
    ],
    [ORDER_STATUS.ACTIVE]: [
      {
        status: ORDER_STATUS.LOST,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Marcar como perdida',
      },
      {
        status: ORDER_STATUS.SHIPPED,
        direction: TRANSITION_DIRECTION.BACKWARD,
        requiresPayment: false,
        description: 'Volver a enviada',
      },
    ],
    [ORDER_STATUS.LOST]: [
      {
        status: ORDER_STATUS.ORDERED,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Reiniciar proceso',
      },
    ],
    [ORDER_STATUS.REJECTED]: [
      {
        status: ORDER_STATUS.ORDERED,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Reintentar pago',
      },
      {
        status: ORDER_STATUS.CANCELLED,
        direction: TRANSITION_DIRECTION.SPECIAL,
        requiresPayment: false,
        description: 'Cancelar orden',
      },
    ],
    [ORDER_STATUS.CANCELLED]: [
      {
        status: ORDER_STATUS.ORDERED,
        direction: TRANSITION_DIRECTION.FORWARD,
        requiresPayment: false,
        description: 'Reiniciar proceso',
      },
    ],
  };

  // Filter by valid transitions
  return (
    allTransitions[currentStatus]?.filter(({ status }) =>
      isValidStatusTransition(currentStatus, status, paymentInfo)
    ) || []
  );
}

/**
 * Gets the display status for an order based on its current status and payment info
 */
export function getDisplayStatus(
  currentStatus: OrderStatus,
  paymentInfo: PaymentInfo
): {
  primaryStatus: OrderStatus;
  secondaryStatuses: OrderStatus[];
  description: string;
} {
  // If the order is ACTIVE but has pending payments, this is inconsistent
  if (currentStatus === ORDER_STATUS.ACTIVE && paymentInfo.hasPendingPayment) {
    return {
      primaryStatus: ORDER_STATUS.SHIPPED,
      secondaryStatuses: [ORDER_STATUS.ACTIVE],
      description: 'Inconsistencia: Activa con pagos pendientes',
    };
  }

  // If the order is PAID but has no confirmed payments, this is inconsistent
  if (currentStatus === ORDER_STATUS.PAID && !paymentInfo.hasConfirmedPayment) {
    return {
      primaryStatus: ORDER_STATUS.ORDERED,
      secondaryStatuses: [ORDER_STATUS.PAID],
      description: 'Inconsistencia: Pagada sin confirmación de pago',
    };
  }

  // If the order is SHIPPED but only has pending payments (no confirmed), this is inconsistent
  if (
    currentStatus === ORDER_STATUS.SHIPPED &&
    !paymentInfo.hasConfirmedPayment &&
    paymentInfo.hasPendingPayment
  ) {
    return {
      primaryStatus: ORDER_STATUS.ORDERED,
      secondaryStatuses: [ORDER_STATUS.SHIPPED],
      description: 'Inconsistencia: Enviada con solo pagos pendientes',
    };
  }

  // If the order is SHIPPED but has no payments at all, this is inconsistent
  if (
    currentStatus === ORDER_STATUS.SHIPPED &&
    paymentInfo.paymentCount === 0
  ) {
    return {
      primaryStatus: ORDER_STATUS.ORDERED,
      secondaryStatuses: [ORDER_STATUS.SHIPPED],
      description: 'Inconsistencia: Enviada sin pagos',
    };
  }

  // If the order is ACTIVE but has no payments, this is inconsistent
  if (currentStatus === ORDER_STATUS.ACTIVE && paymentInfo.paymentCount === 0) {
    return {
      primaryStatus: ORDER_STATUS.ORDERED,
      secondaryStatuses: [ORDER_STATUS.ACTIVE],
      description: 'Inconsistencia: Activa sin pagos',
    };
  }

  // If the order is ACTIVE but has no confirmed payments, this is inconsistent
  if (
    currentStatus === ORDER_STATUS.ACTIVE &&
    !paymentInfo.hasConfirmedPayment
  ) {
    return {
      primaryStatus: ORDER_STATUS.ORDERED,
      secondaryStatuses: [ORDER_STATUS.ACTIVE],
      description: 'Inconsistencia: Activa sin pago confirmado',
    };
  }

  // If the order is ORDERED but has rejected payments, show as REJECTED
  if (
    currentStatus === ORDER_STATUS.ORDERED &&
    paymentInfo.hasRejectedPayment
  ) {
    return {
      primaryStatus: ORDER_STATUS.REJECTED,
      secondaryStatuses: [],
      description: 'Pago rechazado',
    };
  }

  // Normal cases
  switch (currentStatus) {
    case ORDER_STATUS.ORDERED:
      // If ORDERED but has confirmed payment, should show as PAID
      if (paymentInfo.hasConfirmedPayment) {
        return {
          primaryStatus: ORDER_STATUS.PAID,
          secondaryStatuses: [],
          description: '',
        };
      }
      // If ORDERED but has rejected payment, should show as REJECTED
      if (paymentInfo.hasRejectedPayment) {
        return {
          primaryStatus: ORDER_STATUS.REJECTED,
          secondaryStatuses: [],
          description: '',
        };
      }
      return {
        primaryStatus: ORDER_STATUS.ORDERED,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.PAID:
      return {
        primaryStatus: ORDER_STATUS.PAID,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.PRINTING:
      return {
        primaryStatus: ORDER_STATUS.PRINTING,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.SHIPPED:
      return {
        primaryStatus: ORDER_STATUS.SHIPPED,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.ACTIVE:
      return {
        primaryStatus: ORDER_STATUS.ACTIVE,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.LOST:
      return {
        primaryStatus: ORDER_STATUS.LOST,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.REJECTED:
      return {
        primaryStatus: ORDER_STATUS.REJECTED,
        secondaryStatuses: [],
        description: '',
      };

    case ORDER_STATUS.CANCELLED:
      return {
        primaryStatus: ORDER_STATUS.CANCELLED,
        secondaryStatuses: [],
        description: '',
      };

    default:
      return {
        primaryStatus: currentStatus,
        secondaryStatuses: [],
        description: 'Estado desconocido',
      };
  }
}

/**
 * Gets the payment display information for an order
 */
export function getPaymentDisplayInfo(paymentInfo: PaymentInfo): {
  amount: string;
  status: string;
  statusColor: string;
  description: string;
} {
  if (paymentInfo.paymentCount === 0) {
    return {
      amount: 'Sin pago',
      status: 'Sin pago',
      statusColor: 'text-gray-400',
      description: 'No hay pagos registrados',
    };
  }

  const amount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: paymentInfo.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paymentInfo.totalAmount);

  if (paymentInfo.hasConfirmedPayment && !paymentInfo.hasPendingPayment) {
    return {
      amount,
      status: 'Pagado',
      statusColor: 'text-green-600',
      description: 'Pago confirmado',
    };
  }

  if (paymentInfo.hasConfirmedPayment && paymentInfo.hasPendingPayment) {
    return {
      amount,
      status: 'Parcial',
      statusColor: 'text-orange-600',
      description: 'Pago confirmado con pagos pendientes',
    };
  }

  if (paymentInfo.hasPendingPayment) {
    return {
      amount,
      status: 'Pendiente',
      statusColor: 'text-yellow-600',
      description: 'Pago pendiente de confirmación',
    };
  }

  return {
    amount,
    status: 'Rechazado',
    statusColor: 'text-red-600',
    description: 'Pago rechazado',
  };
}

/**
 * Suggests the next logical status for an order
 */
export function suggestNextStatus(
  currentStatus: OrderStatus,
  paymentInfo: PaymentInfo
): OrderStatus | null {
  const transitions = getAvailableStatusTransitions(currentStatus, paymentInfo);
  const forwardTransition = transitions.find(
    (t) => t.direction === TRANSITION_DIRECTION.FORWARD
  );
  return forwardTransition?.status || null;
}

/**
 * Checks if an order has any inconsistencies between status and payments
 */
export function checkOrderConsistency(
  currentStatus: OrderStatus,
  paymentInfo: PaymentInfo
): { isConsistent: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for inconsistencies
  if (currentStatus === ORDER_STATUS.ACTIVE && paymentInfo.hasPendingPayment) {
    issues.push('Orden activa con pagos pendientes');
  }

  if (currentStatus === ORDER_STATUS.PAID && !paymentInfo.hasConfirmedPayment) {
    issues.push('Orden marcada como pagada sin confirmación de pago');
  }

  if (
    currentStatus === ORDER_STATUS.ORDERED &&
    paymentInfo.hasConfirmedPayment
  ) {
    issues.push('Orden creada con pago confirmado (debería estar como pagada)');
  }

  if (
    currentStatus === ORDER_STATUS.SHIPPED &&
    !paymentInfo.hasConfirmedPayment &&
    paymentInfo.hasPendingPayment
  ) {
    issues.push(
      'Orden enviada con solo pagos pendientes (debería estar como creada)'
    );
  }

  if (
    currentStatus === ORDER_STATUS.SHIPPED &&
    paymentInfo.paymentCount === 0
  ) {
    issues.push('Orden enviada sin pagos (debería estar como creada)');
  }

  if (currentStatus === ORDER_STATUS.ACTIVE && paymentInfo.paymentCount === 0) {
    issues.push('Orden activa sin pagos (debería estar como creada)');
  }

  if (
    currentStatus === ORDER_STATUS.ACTIVE &&
    !paymentInfo.hasConfirmedPayment
  ) {
    issues.push('Orden activa sin pago confirmado (debería estar como creada)');
  }

  if (
    currentStatus === ORDER_STATUS.ORDERED &&
    paymentInfo.hasRejectedPayment
  ) {
    issues.push(
      'Orden creada con pago rechazado (debería estar como rechazada)'
    );
  }

  return {
    isConsistent: issues.length === 0,
    issues,
  };
}
