'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import Toast from '@/components/ui/Toast';

interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'saving' | 'saved';
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showLoading: (message: string) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastData, 'id'>>) => void;
  toast: (options: { type: 'error' | 'success' | 'info' | 'warning'; text: string; duration?: number }) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center';
}

export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'bottom-left'
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [generateId, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'error', duration: duration || 6000 });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'info', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const showLoading = useCallback((message: string) => {
    return showToast({ message, type: 'saving', persistent: true });
  }, [showToast]);

  const updateToast = useCallback((id: string, updates: Partial<Omit<ToastData, 'id'>>) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-16 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const toast = useCallback((options: { type: 'error' | 'success' | 'info' | 'warning'; text: string; duration?: number }) => {
    return showToast({
      message: options.text,
      type: options.type,
      duration: options.duration
    });
  }, [showToast]);

  // Memoize context value to prevent re-renders when toasts list changes
  // but the methods remain the same
  const contextValue: ToastContextType = useMemo(() => ({
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    updateToast,
    toast,
  }), [showToast, hideToast, hideAllToasts, showSuccess, showError, showInfo, showWarning, showLoading, updateToast, toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div
        className={`fixed z-50 flex flex-col space-y-2 pointer-events-none ${getPositionClasses()}`}
        style={{ maxWidth: '400px' }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.persistent ? 0 : toast.duration}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook for handling async operations with toast notifications
export function useToastAsync() {
  const toast = useToast();

  const executeWithToast = useCallback(
    async (operation: () => Promise<any>, options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccess?: boolean;
    } = {}) => {
      const {
        loadingMessage = 'Loading...',
        successMessage = 'Operation completed successfully',
        errorMessage = 'An error occurred',
        showSuccess = true,
      } = options;

      let loadingToastId: string | undefined;

      try {
        // Show loading toast
        if (loadingMessage) {
          loadingToastId = toast.showLoading(loadingMessage);
        }

        // Execute operation
        const result = await operation();

        // Hide loading toast
        if (loadingToastId) {
          toast.hideToast(loadingToastId);
        }

        // Show success toast
        if (showSuccess && successMessage) {
          toast.showSuccess(successMessage);
        }

        return result;
      } catch (error) {
        // Hide loading toast
        if (loadingToastId) {
          toast.hideToast(loadingToastId);
        }

        // Show error toast
        const message = error instanceof Error ? error.message : errorMessage;
        toast.showError(message);

        throw error; // Re-throw to allow caller to handle
      }
    },
    [toast]
  );

  return {
    executeWithToast,
    ...toast,
  };
}
