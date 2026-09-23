import { describe, it, expect } from 'vitest';
import { formatFeedbackDate, getFeedbackStatusClass } from './feedbackUtils';

describe('feedbackUtils', () => {
  describe('formatFeedbackDate', () => {
    it('handles empty or invalid dates', () => {
      expect(formatFeedbackDate()).toBe('-');
      expect(formatFeedbackDate('')).toBe('-');
      expect(formatFeedbackDate('invalid-date')).toBe('-');
    });

    it('formats valid date string', () => {
      const formatted = formatFeedbackDate('2026-06-15T10:30:00.000Z');
      expect(formatted).not.toBe('-');
    });
  });

  describe('getFeedbackStatusClass', () => {
    it('returns correct class for each status', () => {
      expect(getFeedbackStatusClass('approved')).toContain('emerald');
      expect(getFeedbackStatusClass('hidden')).toContain('gray');
      expect(getFeedbackStatusClass('deleted')).toContain('red');
      expect(getFeedbackStatusClass('pending')).toContain('amber');
      expect(getFeedbackStatusClass(undefined)).toContain('amber');
    });
  });
});
