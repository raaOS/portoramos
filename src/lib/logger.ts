/**
 * Structured Logger with Request ID Tracking
 * Provides consistent logging across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    timestamp: string;
    requestId?: string;
    message: string;
    context?: Record<string, unknown>;
    stack?: string;
    userId?: string;
    ip?: string;
}

class Logger {
    private requestId?: string;
    private context: Record<string, unknown> = {};

    /**
     * Set request ID for tracking
     */
    setRequestId(id: string): void {
        this.requestId = id;
    }

    /**
     * Set global context
     */
    setContext(ctx: Record<string, unknown>): void {
        this.context = { ...this.context, ...ctx };
    }

    /**
     * Clear request-specific data
     */
    clear(): void {
        this.requestId = undefined;
        this.context = {};
    }

    /**
     * Create log entry
     */
    private createEntry(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): LogEntry {
        return {
            level,
            timestamp: new Date().toISOString(),
            requestId: this.requestId,
            message,
            context: { ...this.context, ...context },
            stack: error?.stack,
        };
    }

    /**
     * Format log for console
     */
    private formatLog(entry: LogEntry): string {
        const emoji = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
        }[entry.level];

        const parts = [
            `${emoji} [${entry.level.toUpperCase()}]`,
            entry.requestId ? `[${entry.requestId}]` : '',
            entry.message,
        ].filter(Boolean);

        return parts.join(' ');
    }

    /**
     * Log debug message
     */
    debug(message: string, context?: Record<string, unknown>): void {
        const entry = this.createEntry('debug', message, context);
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatLog(entry), context || '');
        }
    }

    /**
     * Log info message
     */
    info(message: string, context?: Record<string, unknown>): void {
        const entry = this.createEntry('info', message, context);
        console.log(this.formatLog(entry), context || '');
    }

    /**
     * Log warning
     */
    warn(message: string, context?: Record<string, unknown>): void {
        const entry = this.createEntry('warn', message, context);
        console.warn(this.formatLog(entry), context || '');
    }

    /**
     * Log error
     */
    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        const entry = this.createEntry('error', message, context, error);
        console.error(this.formatLog(entry), {
            ...context,
            error: error?.message,
            stack: error?.stack,
        });

        // In production, send to error tracking service (Sentry, etc.)
        if (process.env.NODE_ENV === 'production') {
            this.sendToErrorTracking(entry, error);
        }
    }

    /**
     * Send error to tracking service
     * TODO: Integrate with Sentry/LogRocket
     */
    private sendToErrorTracking(_entry: LogEntry, _error?: Error): void {
        // Placeholder for error tracking integration
        // Example: Sentry.captureException(_error, { extra: _entry });
    }

    /**
     * Create child logger with additional context
     */
    child(context: Record<string, unknown>): Logger {
        const child = new Logger();
        child.requestId = this.requestId;
        child.context = { ...this.context, ...context };
        return child;
    }
}

// Global logger instance
export const logger = new Logger();

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware helper to set request ID
 */
export function withRequestId<T extends (...args: unknown[]) => Promise<unknown>>(handler: T) {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const requestId = generateRequestId();
        logger.setRequestId(requestId);

        try {
            return await handler(...args);
        } finally {
            logger.clear();
        }
    };
}
