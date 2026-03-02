/**
 * API Response Utilities
 * 
 * Standardizes API response format across all routes.
 * Ensures consistent error handling and response structure.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================
// Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Success Responses
// ============================================

/**
 * Create a success response with data
 */
export function success<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  );
}

/**
 * Create a success response for creation operations
 */
export function created<T>(
  data: T,
  message: string = 'Created successfully'
): NextResponse<ApiSuccessResponse<T>> {
  return success(data, message, 201);
}

/**
 * Create a success response for deletion operations
 */
export function deleted(message: string = 'Deleted successfully'): NextResponse<ApiSuccessResponse<null>> {
  return success(null, message, 200);
}

// ============================================
// Error Responses
// ============================================

/**
 * Create a bad request error response
 */
export function badRequest(
  error: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error
  };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status: 400 });
}

/**
 * Create an unauthorized error response
 */
export function unauthorized(
  error: string = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden error response
 */
export function forbidden(
  error: string = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status: 403 }
  );
}

/**
 * Create a not found error response
 */
export function notFound(
  error: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status: 404 }
  );
}

/**
 * Create a rate limit error response
 */
export function rateLimit(
  retryAfter: number,
  error: string = 'Too many requests'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code: 'RATE_LIMITED'
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) }
    }
  );
}

/**
 * Create an internal server error response
 */
export function serverError(
  error: string = 'Internal server error',
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error
  };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status: 500 });
}

// ============================================
// Validation Error Handling
// ============================================

/**
 * Create a validation error response from ZodError
 */
export function validationError(zodError: ZodError): NextResponse<ApiErrorResponse> {
  const formattedErrors = zodError.format();
  
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    },
    { status: 400 }
  );
}

// ============================================
// Error Logging Helper
// ============================================

/**
 * Log API error with consistent format
 */
export function logError(route: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[API Error] ${timestamp} | ${route}:`, errorMessage);
  if (errorStack) {
    console.error('Stack:', errorStack);
  }
}
