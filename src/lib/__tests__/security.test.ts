import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, sanitize, validate, generateSecureToken } from '../security';

describe('security utils', () => {
    describe('generateSecureToken', () => {
        it('should generate a 64-character hex string', () => {
            const token = generateSecureToken();
            expect(token).toHaveLength(64);
            expect(token).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe('checkRateLimit', () => {
        const ip = '127.0.0.1';

        beforeEach(() => {
            resetRateLimit(ip);
        });

        it('should allow requests within limit', () => {
            for (let i = 0; i < 5; i++) {
                expect(checkRateLimit(ip)).toBe(true);
            }
        });

        it('should block requests exceeding limit', () => {
            // Mocking 100 as the limit from the source code
            for (let i = 0; i < 100; i++) {
                checkRateLimit(ip);
            }
            expect(checkRateLimit(ip)).toBe(false);
        });
    });

    describe('sanitize', () => {
        it('should sanitize HTML', () => {
            const input = '<script>alert("xss")</script>';
            const sanitized = sanitize.html(input);
            expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('should sanitize email', () => {
            expect(sanitize.email(' RAMOS@Example.com ')).toBe('ramos@example.com');
        });

        it('should sanitize filenames', () => {
            expect(sanitize.filename('my document!.pdf')).toBe('my_document_.pdf');
            expect(sanitize.filename('.hidden')).toBe('filehidden');
        });

        it('should sanitize SQL', () => {
            expect(sanitize.sql("SELECT * FROM users; DROP TABLE--")).toBe("SELECT * FROM users DROP TABLE");
        });
    });

    describe('validate', () => {
        it('should validate strong passwords', () => {
            expect(validate.strongPassword('Short1!').valid).toBe(false);
            expect(validate.strongPassword('NoSpecial1').valid).toBe(false);
            expect(validate.strongPassword('ValidPassword1!').valid).toBe(true);
        });

        it('should validate emails', () => {
            expect(validate.email('invalid-email')).toBe(false);
            expect(validate.email('valid@email.com')).toBe(true);
        });
    });
});
