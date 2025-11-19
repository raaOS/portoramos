'use client'
import React from 'react'

// Custom arrow icon for the select dropdown
const SelectArrow = () => (
  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
    </svg>
  </div>
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  selectClassName?: string
}

export default function Select({
  label,
  hint,
  error,
  required,
  className = '',
  selectClassName = '',
  id,
  children,
  ...props
}: SelectProps) {
  const generatedId = React.useId()
  const selectId = id || generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`

  const commonClasses = `block w-full pl-3 pr-10 py-2 border rounded-md transition-colors duration-200 ease-in-out bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 appearance-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
    error 
      ? 'border-red-400 text-red-900 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  } ${selectClassName}`;

  const ariaDescribedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
    props['aria-describedby']
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-600" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...props}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : undefined}
          className={commonClasses}
        >
          {children}
        </select>
        <SelectArrow />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
}