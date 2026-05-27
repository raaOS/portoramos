/**
 * Validation utilities for Telegram Webhook
 */

// Sanitize error for user display (never expose internal details)
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Only return safe, generic messages
    if (error.message.includes('ENOENT')) return 'File not found';
    if (error.message.includes('EACCES')) return 'Permission denied';
    if (error.message.includes('JSON')) return 'Invalid data format';
    return 'Internal error occurred';
  }
  return 'Unknown error';
}

// Validate incoming webhook data
export interface WebhookBody {
  message?: {
    text?: string;
    chat?: unknown;
    message_thread_id?: number;
    reply_to_message?: {
      message_id?: number;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateWebhookData(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }

  const webhookBody = body as WebhookBody;

  if (webhookBody.message && typeof webhookBody.message !== 'object') {
    return { valid: false, error: 'Invalid message format' };
  }

  if (webhookBody.callback_query && typeof webhookBody.callback_query !== 'object') {
    return { valid: false, error: 'Invalid callback_query format' };
  }

  if (webhookBody.message?.text && typeof webhookBody.message.text !== 'string') {
    return { valid: false, error: 'Invalid text format' };
  }

  return { valid: true };
}
