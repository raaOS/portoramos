'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic Error Boundary Component
 * 
 * Catches JavaScript errors in child components and renders fallback UI.
 * Prevents white screen crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6">
              We apologize for the inconvenience. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left text-sm text-red-400 bg-gray-800 p-4 rounded">
                <summary>Error Details (Dev Only)</summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * OS Desktop Specific Error Boundary
 * Provides macOS-style error dialog
 */
export class DesktopErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[DesktopErrorBoundary] OS crash:', error);
    console.error('[DesktopErrorBoundary] Stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">System Error</h2>
                <p className="text-gray-400 text-sm">Ramos OS encountered a problem</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              The desktop environment crashed unexpectedly. Your data has been preserved.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Restart System
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Safe Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Section-specific Error Boundary
 * Renders smaller fallback for non-critical sections
 */
export class SectionErrorBoundary extends Component<{ 
  children: ReactNode; 
  sectionName: string;
  fallback?: ReactNode;
}, State> {
  constructor(props: { 
    children: ReactNode; 
    sectionName: string;
    fallback?: ReactNode;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    console.error(`[SectionErrorBoundary:${this.props.sectionName}] Error:`, error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            ⚠️ {this.props.sectionName} failed to load
          </h3>
          <p className="text-red-600 text-sm">
            This section encountered an error. Other parts of the application may still work.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Handler Hook
 * For handling errors in async operations (not render errors)
 */
export function useAsyncErrorHandler() {
  const handleError = (error: unknown, context: string): void => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[AsyncError:${context}]`, err);
    
    // Could integrate with error tracking service here
    // Sentry.captureException(err);
  };

  const wrapAsync = async <T,>(
    promise: Promise<T>,
    context: string
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  return { handleError, wrapAsync };
}
