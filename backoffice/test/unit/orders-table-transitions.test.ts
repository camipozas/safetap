import { describe, test, expect } from 'vitest';

// Mock the Order type for testing
type Order = {
  id: string;
  slug: string;
  serial: string;
  nameOnSticker: string;
  flagCode: string;
  stickerColor: string;
  textColor: string;
  status: 'ORDERED' | 'PAID' | 'PRINTING' | 'SHIPPED' | 'ACTIVE' | 'LOST';
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
    country: string | null;
  };
  profile?: {
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes: string | null;
    contacts: {
      name: string;
      phone: string;
      relation: string;
    }[];
  } | null;
  payments: {
    id: string;
    status:
      | 'PENDING'
      | 'TRANSFER_PAYMENT'
      | 'VERIFIED'
      | 'PAID'
      | 'TRANSFERRED'
      | 'REJECTED'
      | 'CANCELLED';
    amountCents: number;
    currency: string;
    createdAt: Date;
  }[];
};

// Copy the functions from OrdersTable for testing
const isValidTransition = (
  currentStatus: Order['status'],
  newStatus: Order['status'],
  payments: Order['payments']
): boolean => {
  const hasConfirmedPayment = payments.some((p) =>
    ['PAID', 'VERIFIED', 'TRANSFERRED'].includes(p.status)
  );
  const hasPendingPayment = payments.some((p) => p.status === 'PENDING');

  // Business rules
  switch (currentStatus) {
    case 'ORDERED':
      if (newStatus === 'PAID') return hasConfirmedPayment;
      if (newStatus === 'LOST') return true;
      return false;

    case 'PAID':
      if (newStatus === 'PRINTING') return hasConfirmedPayment;
      if (newStatus === 'ORDERED') return true; // Can go back
      if (newStatus === 'LOST') return true;
      return false;

    case 'PRINTING':
      if (newStatus === 'SHIPPED') return hasConfirmedPayment;
      if (newStatus === 'PAID') return true; // Can go back
      if (newStatus === 'LOST') return true;
      return false;

    case 'SHIPPED':
      if (newStatus === 'ACTIVE')
        return hasConfirmedPayment && !hasPendingPayment;
      if (newStatus === 'PRINTING') return true; // Can go back
      if (newStatus === 'LOST') return true;
      return false;

    case 'ACTIVE':
      if (newStatus === 'LOST') return true;
      if (newStatus === 'SHIPPED') return true; // Can go back if there's an issue
      return false;

    case 'LOST':
      if (newStatus === 'ORDERED') return true; // Can restart process
      return false;

    default:
      return false;
  }
};

const getAvailableTransitions = (
  currentStatus: Order['status'],
  payments: Order['payments']
): Array<{
  status: Order['status'];
  direction: 'forward' | 'backward' | 'special';
}> => {
  const allTransitions: Record<
    Order['status'],
    Array<{
      status: Order['status'];
      direction: 'forward' | 'backward' | 'special';
    }>
  > = {
    ORDERED: [
      { status: 'PAID', direction: 'forward' },
      { status: 'LOST', direction: 'special' },
    ],
    PAID: [
      { status: 'PRINTING', direction: 'forward' },
      { status: 'ORDERED', direction: 'backward' },
      { status: 'LOST', direction: 'special' },
    ],
    PRINTING: [
      { status: 'SHIPPED', direction: 'forward' },
      { status: 'PAID', direction: 'backward' },
      { status: 'LOST', direction: 'special' },
    ],
    SHIPPED: [
      { status: 'ACTIVE', direction: 'forward' },
      { status: 'PRINTING', direction: 'backward' },
      { status: 'LOST', direction: 'special' },
    ],
    ACTIVE: [
      { status: 'LOST', direction: 'special' },
      { status: 'SHIPPED', direction: 'backward' },
    ],
    LOST: [{ status: 'ORDERED', direction: 'forward' }],
  };

  // Filter by valid transitions
  return (
    allTransitions[currentStatus]?.filter(({ status }) =>
      isValidTransition(currentStatus, status, payments)
    ) || []
  );
};

// Create mock payment objects
const createPayment = (
  status: Order['payments'][0]['status'],
  amountCents = 6990
): Order['payments'][0] => ({
  id: 'test-payment-id',
  status,
  amountCents,
  currency: 'CLP',
  createdAt: new Date(),
});

describe('Order Status Transitions', () => {
  describe('ORDERED status transitions', () => {
    test('should allow transition to PAID when payment is confirmed', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('ORDERED', 'PAID', payments)).toBe(true);
    });

    test('should not allow transition to PAID when payment is pending', () => {
      const payments = [createPayment('PENDING')];
      expect(isValidTransition('ORDERED', 'PAID', payments)).toBe(false);
    });

    test('should always allow transition to LOST', () => {
      const payments = [createPayment('PENDING')];
      expect(isValidTransition('ORDERED', 'LOST', payments)).toBe(true);
    });

    test('should not allow direct transition to PRINTING from ORDERED', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('ORDERED', 'PRINTING', payments)).toBe(false);
    });
  });

  describe('PAID status transitions', () => {
    test('should allow transition to PRINTING when payment is confirmed', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('PAID', 'PRINTING', payments)).toBe(true);
    });

    test('should allow backward transition to ORDERED', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('PAID', 'ORDERED', payments)).toBe(true);
    });

    test('should not allow transition to PRINTING when payment is pending', () => {
      const payments = [createPayment('PENDING')];
      expect(isValidTransition('PAID', 'PRINTING', payments)).toBe(false);
    });
  });

  describe('SHIPPED to ACTIVE transition', () => {
    test('should allow transition to ACTIVE when payment is confirmed and no pending payments', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('SHIPPED', 'ACTIVE', payments)).toBe(true);
    });

    test('should not allow transition to ACTIVE when there are pending payments', () => {
      const payments = [createPayment('PAID'), createPayment('PENDING')];
      expect(isValidTransition('SHIPPED', 'ACTIVE', payments)).toBe(false);
    });

    test('should not allow transition to ACTIVE when payment is only pending', () => {
      const payments = [createPayment('PENDING')];
      expect(isValidTransition('SHIPPED', 'ACTIVE', payments)).toBe(false);
    });
  });

  describe('ACTIVE status transitions', () => {
    test('should allow transition to LOST', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('ACTIVE', 'LOST', payments)).toBe(true);
    });

    test('should allow backward transition to SHIPPED for troubleshooting', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('ACTIVE', 'SHIPPED', payments)).toBe(true);
    });

    test('should not allow transition to other forward states', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('ACTIVE', 'PRINTING', payments)).toBe(false);
    });
  });

  describe('LOST status transitions', () => {
    test('should allow restart to ORDERED', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('LOST', 'ORDERED', payments)).toBe(true);
    });

    test('should not allow direct transition to other states', () => {
      const payments = [createPayment('PAID')];
      expect(isValidTransition('LOST', 'PAID', payments)).toBe(false);
      expect(isValidTransition('LOST', 'ACTIVE', payments)).toBe(false);
    });
  });

  describe('getAvailableTransitions function', () => {
    test('should return correct transitions for ORDERED with confirmed payment', () => {
      const payments = [createPayment('PAID')];
      const transitions = getAvailableTransitions('ORDERED', payments);

      expect(transitions).toHaveLength(2);
      expect(transitions.find((t) => t.status === 'PAID')).toBeDefined();
      expect(transitions.find((t) => t.status === 'LOST')).toBeDefined();
    });

    test('should return only LOST for ORDERED with pending payment', () => {
      const payments = [createPayment('PENDING')];
      const transitions = getAvailableTransitions('ORDERED', payments);

      expect(transitions).toHaveLength(1);
      expect(transitions[0].status).toBe('LOST');
    });

    test('should include backward transitions with correct direction', () => {
      const payments = [createPayment('PAID')];
      const transitions = getAvailableTransitions('PAID', payments);

      const backwardTransition = transitions.find(
        (t) => t.status === 'ORDERED'
      );
      expect(backwardTransition?.direction).toBe('backward');

      const forwardTransition = transitions.find(
        (t) => t.status === 'PRINTING'
      );
      expect(forwardTransition?.direction).toBe('forward');

      const specialTransition = transitions.find((t) => t.status === 'LOST');
      expect(specialTransition?.direction).toBe('special');
    });

    test('should prevent ACTIVE transition when there are pending payments', () => {
      const payments = [createPayment('PAID'), createPayment('PENDING')];
      const transitions = getAvailableTransitions('SHIPPED', payments);

      const activeTransition = transitions.find((t) => t.status === 'ACTIVE');
      expect(activeTransition).toBeUndefined();
    });
  });

  describe('Payment status consistency rules', () => {
    test('VERIFIED payment should be treated as confirmed', () => {
      const payments = [createPayment('VERIFIED')];
      expect(isValidTransition('ORDERED', 'PAID', payments)).toBe(true);
    });

    test('TRANSFERRED payment should be treated as confirmed', () => {
      const payments = [createPayment('TRANSFERRED')];
      expect(isValidTransition('ORDERED', 'PAID', payments)).toBe(true);
    });

    test('multiple payments with mixed statuses should check both confirmed and pending', () => {
      const payments = [
        createPayment('PAID'),
        createPayment('VERIFIED'),
        createPayment('PENDING'),
      ];

      // Should allow transitions that require confirmed payment
      expect(isValidTransition('ORDERED', 'PAID', payments)).toBe(true);

      // Should prevent transitions that require no pending payments
      expect(isValidTransition('SHIPPED', 'ACTIVE', payments)).toBe(false);
    });
  });
});
