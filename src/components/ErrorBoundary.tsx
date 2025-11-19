'use client';

import { useEffect, useState, Component, ReactNode } from 'react';
import { PageErrorFallback } from '@/components/ui/ErrorFallback';
// Temporarily removed logger import to fix chunk loading issue
// import { logError } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Class-based Error Boundary for catching React errors
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Simple console log without any dynamic imports
    console.error('ErrorBoundary caught an error:', error.message);
  }



  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback || (
        <PageErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for handling unhandled errors
export function useErrorHandler() {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      // Simple console log without any dynamic imports
      console.error('Unhandled error:', error.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent default browser behavior
      event.preventDefault();
      
      // Simple console log without any dynamic imports
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
