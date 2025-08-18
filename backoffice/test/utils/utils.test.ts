import {
  calculateGrowthPercentage,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
} from '@/lib/utils';
import { describe, expect, it } from 'vitest';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(2500, 'CLP')).toContain('25');
      expect(formatCurrency(2500, 'CLP')).toContain('$');
      expect(formatCurrency(1000, 'USD')).toContain('10,00');
      expect(formatCurrency(1000, 'USD')).toContain('US$');
      expect(formatCurrency(0, 'CLP')).toContain('0');
    });

    it('defaults to CLP', () => {
      const result = formatCurrency(699000);
      expect(result).toContain('6.990');
      expect(result).toContain('$');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('15');
      expect(formatted).toContain('enero');
      expect(formatted).toContain('2024');
    });

    it('accepts string dates', () => {
      const formatted = formatDate('2024-01-15T10:30:00Z');
      expect(formatted).toContain('15');
      expect(formatted).toContain('enero');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('formats datetime correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('15');
      expect(formatted).toContain('ene');
      expect(formatted).toContain('2024');
      expect(formatted).toMatch(/\d{2}:\d{2}/); // Should contain time
    });
  });

  describe('getStatusColor', () => {
    it('returns correct colors for order statuses', () => {
      expect(getStatusColor('ORDERED')).toBe('bg-slate-100 text-slate-800');
      expect(getStatusColor('PAID')).toBe('bg-emerald-100 text-emerald-800');
      expect(getStatusColor('PRINTING')).toBe('bg-amber-100 text-amber-800');
      expect(getStatusColor('SHIPPED')).toBe('bg-blue-100 text-blue-800');
      expect(getStatusColor('ACTIVE')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('LOST')).toBe('bg-red-100 text-red-800');
    });

    it('returns correct colors for payment statuses', () => {
      expect(getStatusColor('PENDING')).toBe('bg-yellow-100 text-yellow-800');
      expect(getStatusColor('VERIFIED')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('REJECTED')).toBe('bg-red-100 text-red-800');
    });

    it('returns default color for unknown status', () => {
      expect(getStatusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
    });
  });

  describe('calculateGrowthPercentage', () => {
    it('calculates growth percentage correctly', () => {
      expect(calculateGrowthPercentage(120, 100)).toBe(20);
      expect(calculateGrowthPercentage(80, 100)).toBe(-20);
      expect(calculateGrowthPercentage(100, 100)).toBe(0);
    });

    it('handles zero previous value', () => {
      expect(calculateGrowthPercentage(50, 0)).toBe(100);
      expect(calculateGrowthPercentage(0, 0)).toBe(0);
    });

    it('handles negative values', () => {
      expect(calculateGrowthPercentage(-50, 100)).toBe(-150);
      expect(calculateGrowthPercentage(50, -100)).toBe(-150);
    });

    it('handles decimal values', () => {
      expect(calculateGrowthPercentage(110.5, 100)).toBe(10.5);
      expect(calculateGrowthPercentage(100, 90.5)).toBeCloseTo(10.497, 2);
    });
  });
});
