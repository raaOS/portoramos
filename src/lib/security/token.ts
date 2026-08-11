/**
 * Generates a cryptographically secure random token.
 *
 * @returns A 64-character hexadecimal string.
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
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
  if (!token || !sessionToken) return false;
  if (token.length !== 64 || sessionToken.length !== 64) return false;

  // Timing-safe comparison to prevent side-channel attacks.
  // Uses a constant-time XOR approach that works in both Node.js and Edge
  // runtimes without depending on require('crypto').
  const bufA = Buffer.from(token, 'hex');
  const bufB = Buffer.from(sessionToken, 'hex');
  if (bufA.length !== bufB.length) return false;

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

