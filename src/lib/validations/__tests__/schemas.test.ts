import { describe, expect, it } from 'vitest';
import { feedbackSubmissionSchema } from '../schemas';

describe('feedbackSubmissionSchema', () => {
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
