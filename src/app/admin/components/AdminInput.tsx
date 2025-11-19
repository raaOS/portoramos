'use client';

import { forwardRef } from 'react';

interface AdminInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  [key: string]: any;
}

const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, helperText, required, className = '', ...props }, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId || helperId || undefined}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
  }
);

AdminInput.displayName = 'AdminInput';

export default AdminInput;
