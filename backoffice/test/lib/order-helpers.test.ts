import { getPaymentStatusForOrderStatus } from '@/lib/order-helpers';
import { describe, expect, test } from 'vitest';

describe('getPaymentStatusForOrderStatus', () => {
  test('returns PENDING for ORDERED status', () => {
    const result = getPaymentStatusForOrderStatus('ORDERED');
    expect(result).toBe('PENDING');
  });

  test('returns VERIFIED for PAID status', () => {
    const result = getPaymentStatusForOrderStatus('PAID');
    expect(result).toBe('VERIFIED');
  });

  test('returns PAID for PRINTING status', () => {
    const result = getPaymentStatusForOrderStatus('PRINTING');
    expect(result).toBe('PAID');
  });

  test('returns PAID for SHIPPED status', () => {
    const result = getPaymentStatusForOrderStatus('SHIPPED');
    expect(result).toBe('PAID');
  });

  test('returns PAID for ACTIVE status', () => {
    const result = getPaymentStatusForOrderStatus('ACTIVE');
    expect(result).toBe('PAID');
  });

  test('returns REJECTED for REJECTED status', () => {
    const result = getPaymentStatusForOrderStatus('REJECTED');
    expect(result).toBe('REJECTED');
  });

  test('returns CANCELLED for CANCELLED status', () => {
    const result = getPaymentStatusForOrderStatus('CANCELLED');
    expect(result).toBe('CANCELLED');
  });

  test('returns PAID for LOST status (keeps payment as paid)', () => {
    const result = getPaymentStatusForOrderStatus('LOST');
    expect(result).toBe('PAID');
  });

  test('returns null for invalid status', () => {
    const result = getPaymentStatusForOrderStatus('INVALID_STATUS' as any);
    expect(result).toBe(null);
  });
});
