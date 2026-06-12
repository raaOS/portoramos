import { describe, expect, it } from 'vitest';
import { feedbackSubmissionSchema } from '../schemas';

describe('feedbackSubmissionSchema', () => {
  it('accepts valid minimal feedback (rating only)', () => {
    const result = feedbackSubmissionSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it('accepts full valid feedback with all optional fields', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      message: 'Keren banget!',
      name: 'Budi',
      fromPath: '/projects/test',
      clientId: 'abc12345',
      device: 'desktop',
      formOpenedAt: Date.now(),
      source: 'exit-intent',
      website_url: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = feedbackSubmissionSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects rating above 5', () => {
    const result = feedbackSubmissionSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer rating', () => {
    const result = feedbackSubmissionSchema.safeParse({ rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding 500 characters', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      message: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 50 characters', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      name: 'x'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid device enum value', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      device: 'smartwatch',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source enum value', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      source: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative formOpenedAt', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      formOpenedAt: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects clientId shorter than 8 characters', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      clientId: 'abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields (strict mode)', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      unknownField: 'hack',
    });
    expect(result.success).toBe(false);
  });

  it('accepts non-empty honeypot values so the route can silently discard bots', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      website_url: 'https://spam.example',
    });
    expect(result.success).toBe(true);
  });

  it('still caps honeypot payload size', () => {
    const result = feedbackSubmissionSchema.safeParse({
      rating: 5,
      website_url: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
