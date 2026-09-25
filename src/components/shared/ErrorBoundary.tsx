'use client';

import { useEffect, Component, ReactNode, ErrorInfo } from 'react';
import dynamic from 'next/dynamic';

const PageErrorFallback = dynamic(
  () => import('@/components/ui/ErrorFallback').then((mod) => mod.PageErrorFallback),
  { ssr: false }
);

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error.message);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback || (
          <PageErrorFallback
            error={this.state.error}
            resetError={() =>
              this.setState({ hasError: false, error: null, errorInfo: undefined })
            }
          />
        )
      );
    }

    return this.props.children;
  }
}

export class DesktopErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[DesktopErrorBoundary] OS crash:', error);
    console.error('[DesktopErrorBoundary] Stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-2xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl text-white">
                ⚠️
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">System Error</h2>
                <p className="text-sm text-gray-400">Ramos OS encountered a problem</p>
              </div>
            </div>

            <p className="mb-6 text-gray-300">
              The desktop environment crashed unexpectedly. Your data has been preserved.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Restart System
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
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

export class SectionErrorBoundary extends Component<
  {
    children: ReactNode;
    sectionName: string;
    fallback?: ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; sectionName: string; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 font-semibold text-red-800">
            ⚠️ {this.props.sectionName} failed to load
          </h3>
          <p className="text-sm text-red-600">
            This section encountered an error. Other parts of the application may still work.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 text-sm text-red-700 underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function useErrorHandler() {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Unhandled error:', error.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
}

export function useAsyncErrorHandler() {
  const handleError = (error: unknown, context: string): void => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[AsyncError:${context}]`, err);
  };

  const wrapAsync = async <T,>(promise: Promise<T>, context: string): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  return { handleError, wrapAsync };
}
