import { describe, it, expect } from 'vitest';
import { formatVideoTime, getAspectOptions } from './videoTrimmerUtils';

describe('videoTrimmerUtils', () => {
  describe('formatVideoTime', () => {
    it('formats seconds to mm:ss', () => {
      expect(formatVideoTime(0)).toBe('0:00');
      expect(formatVideoTime(9)).toBe('0:09');
      expect(formatVideoTime(65)).toBe('1:05');
      expect(formatVideoTime(600)).toBe('10:00');
    });

    it('handles negative or invalid values', () => {
      expect(formatVideoTime(-10)).toBe('0:00');
      expect(formatVideoTime(NaN)).toBe('0:00');
    });
  });

  describe('getAspectOptions', () => {
    it('returns aspect options with natural aspect injected', () => {
      const options = getAspectOptions(1.77);
      expect(options.length).toBe(6);
      expect(options[0].label).toBe('Free');
      expect(options[1].value).toBe(1.77);
    });
  });
});
