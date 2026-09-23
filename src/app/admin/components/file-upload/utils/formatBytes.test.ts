import { describe, it, expect } from 'vitest';
import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('handles zero, negative, and invalid values', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(-100)).toBe('0 KB');
    expect(formatBytes(NaN)).toBe('0 KB');
    expect(formatBytes(Infinity)).toBe('0 KB');
  });

  it('formats KB range', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
  });

  it('formats MB range with 2 decimals', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });
});
