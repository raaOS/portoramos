'use client';

import React from 'react';
import { useToast } from '@/contexts/ToastContext';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
  variant?: 'page' | 'component' | 'inline';
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDetails = process.env.NODE_ENV === 'development',
  variant = 'page'
}: ErrorFallbackProps) {
  const { showError } = useToast();

  const handleRetry = () => {
    try {
      resetError();
    } catch (retryError) {
      showError('Failed to retry. Please refresh the page.');
    }
  };

  const handleReportError = () => {
    // In a real app, you would send this to your error reporting service
    navigator.clipboard.writeText(error.stack || error.message)
      .then(() => {
        showError('Error details copied to clipboard');
      })
      .catch(() => {
        showError('Failed to copy error details');
      });
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'page':
        return 'min-h-screen flex items-center justify-center p-4';
      case 'component':
        return 'min-h-[200px] flex items-center justify-center p-4';
      case 'inline':
        return 'p-4';
      default:
        return 'min-h-screen flex items-center justify-center p-4';
    }
  };

  return (
    <div className={getVariantClasses()}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Content */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {description}
        </p>

        {/* Error Details (Development Only) */}
        {showDetails && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Error Details:
            </h4>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap break-words">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Page
          </button>

          {showDetails && (
            <button
              onClick={handleReportError}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Error
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specific error fallbacks for different scenarios
export function PageErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Page Error"
      description="This page encountered an error. Please try refreshing or go back to the homepage."
      variant="page"
    />
  );
}

export function ComponentErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Component Error"
      description="This component failed to load. Please try again."
      variant="component"
    />
  );
}

export function InlineErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title="Error"
      description="Something went wrong."
      variant="inline"
      showDetails={false}
    />
  );
}