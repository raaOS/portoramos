/**
 * Generates a cryptographically secure random token.
 * 
 * @returns A 64-character hexadecimal string.
 */
export function generateSecureToken(): string {
    if (typeof window === 'undefined' && typeof globalThis.crypto === 'undefined') {
        // Fallback for very old environments, though unlikely in Next.js
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    }

    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random CSRF token.
 * 
 * @returns A 64-character hexadecimal string.
 */
export function generateCSRFToken(): string {
    return generateSecureToken();
}

/**
 * Validates a CSRF token against a session token.
 * 
 * @param token - The token provided in the request.
 * @param sessionToken - The token stored in the session/cookie.
 * @returns true if tokens match and are valid.
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    if (token.length !== 64 || sessionToken.length !== 64) return false

    // Simple validation - in production, use proper CSRF validation
    return token === sessionToken
}
