'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 flex w-full flex-col overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all ${sizeClasses[size]}`}
        style={{ maxHeight: 'calc(100dvh - 3rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <h3 className="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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
  );

  // Portal to document.body so the modal escapes any ancestor CSS transform
  // (e.g. AdminWindowFrame's .admin-window which has transform: skew/scale,
  // causing position:fixed to be relative to the window frame, not viewport)
  return createPortal(modalContent, document.body);
}
