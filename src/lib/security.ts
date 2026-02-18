// Input validation schemas
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Secure token generation
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

// Rate limiting storage
const rateLimits = new Map<string, {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}>()

const MAX_ATTEMPTS = 100
const LOCKOUT_MINUTES = 15

// Rate limiting
/**
 * Checks if the given IP address has exceeded the rate limit.
 * Implements a lockout period if the maximum number of attempts is reached.
 * 
 * @param ip - The IP address to check.
 * @returns true if the request is allowed, false if rate-limited or locked out.
 */
export function checkRateLimit(ip: string): boolean {
  if (!ip) return false

  const now = Date.now()
  const attempt = rateLimits.get(ip) || { count: 0, lastAttempt: 0 }

  // Reset if lockout period has passed
  if (attempt.lockedUntil && now > attempt.lockedUntil) {
    attempt.count = 0
    attempt.lockedUntil = undefined
  }

  // Check if currently locked out
  if (attempt.lockedUntil && now <= attempt.lockedUntil) {
    return false
  }

  // Reset count if enough time has passed
  if (now - attempt.lastAttempt > LOCKOUT_MINUTES * 60 * 1000) {
    attempt.count = 0
  }

  // Check if max attempts reached
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + (LOCKOUT_MINUTES * 60 * 1000)
    rateLimits.set(ip, attempt)
    return false
  }

  attempt.count++
  attempt.lastAttempt = now
  rateLimits.set(ip, attempt)

  return true
}

// Reset rate limiting state for an IP
/**
 * Resets the rate limiting record for a specific IP address.
 * 
 * @param ip - The IP address to reset.
 */
export function resetRateLimit(ip: string): void {
  if (!ip) return
  rateLimits.delete(ip)
}

// Sanitize input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// Enhanced sanitization functions
/**
 * Set of utility functions for sanitizing user input.
 */
export const sanitize = {
  /**
   * Escapes HTML special characters to prevent XSS.
   * 
   * @param input - The string to sanitize.
   * @returns The escaped string.
   */
  html: (input: string): string => {
    if (typeof input !== 'string') return ''
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .substring(0, 10000)
  },

  email: (input: string): string => {
    return input.toLowerCase().trim().substring(0, 254)
  },

  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255)
      .replace(/^[._]/, 'file')
  },

  sql: (input: string): string => {
    return input
      .replace(/[';"\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*|\*\//g, '')
      .trim()
      .substring(0, 1000)
  },
}

// CSRF token generation
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

// Validation utilities
export const validate = {
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  length: (text: string, min: number = 0, max: number = Infinity): boolean => {
    return text.length >= min && text.length <= max
  },

  alphanumeric: (text: string): boolean => {
    return /^[a-zA-Z0-9]+$/.test(text)
  },

  /**
   * Validates if a password meets minimum complexity requirements:
   * 8+ chars, uppercase, lowercase, number, and special character.
   * 
   * @param password - The password to validate.
   * @returns Validation result with boolean status and error messages.
   */
  strongPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Project data validation
export function validateProjectData(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid project data'] }
  }

  const project = data as Record<string, unknown>

  // Title validation
  if (!project.title || typeof project.title !== 'string') {
    errors.push('Title is required and must be a string')
  } else if (project.title.length < 1 || project.title.length > 200) {
    errors.push('Title must be between 1 and 200 characters')
  }

  // Description validation
  if (project.description && typeof project.description !== 'string') {
    errors.push('Description must be a string')
  } else if (project.description && typeof project.description === 'string' && project.description.length > 2000) {
    errors.push('Description must be less than 2000 characters')
  }

  // URL validation
  if (project.url && typeof project.url === 'string' && !isValidUrl(project.url)) {
    errors.push('Invalid URL format')
  }

  // GitHub URL validation
  if (project.github && typeof project.github === 'string' && !isValidUrl(project.github)) {
    errors.push('Invalid GitHub URL format')
  }

  // Technologies validation
  if (project.technologies && !Array.isArray(project.technologies)) {
    errors.push('Technologies must be an array')
  } else if (project.technologies) {
    const techs = project.technologies as unknown[]
    if (techs.some(tech => typeof tech !== 'string')) {
      errors.push('All technologies must be strings')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get client IP address
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (cfIP) return cfIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}

// Cleanup old rate limit entries
export function cleanupRateLimits(): void {
  const now = Date.now()
  const cutoff = now - (24 * 60 * 60 * 1000) // 24 hours

  for (const [ip, data] of rateLimits.entries()) {
    if (data.lastAttempt < cutoff) {
      rateLimits.delete(ip)
    }
  }
}
