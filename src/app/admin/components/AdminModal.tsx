'use client';

import { ReactNode, useEffect } from 'react';
import AdminButton from './AdminButton';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
}: AdminModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center px-2 pb-20 pt-4 text-center sm:block sm:p-0 sm:px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`inline-flex max-h-[90vh] w-full transform flex-col overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="truncate pr-2 text-base font-semibold text-gray-900 sm:text-lg">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 sm:px-6"
            data-lenis-prevent
          >
            {children}
          </div>

          {/* Footer */}
          {(actions || (
            <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
              <AdminButton variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </AdminButton>
            </div>
          )) && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
              {actions || (
                <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
                  <AdminButton variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                    Cancel
                  </AdminButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
