"use client"
import React from 'react'

type BaseProps = {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  inputClassName?: string
}

type InputHTML = React.InputHTMLAttributes<HTMLInputElement>
type TextareaHTML = React.TextareaHTMLAttributes<HTMLTextAreaElement>

type InputProps = BaseProps & (
  | ({ as?: 'input' } & InputHTML)
  | ({ as: 'textarea' } & TextareaHTML)
)

export default function Input(props: InputProps) {
  const { label, hint, error, required, className = '', inputClassName = '', as = 'input', id, ...restProps } = props as any
  const generatedId = React.useId()
  const inputId = id || generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const common = `block w-full px-3 py-2 border rounded-md transition-colors duration-200 ease-in-out bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
    error 
      ? 'border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  } ${inputClassName}`

  // Build aria-describedby attribute
  const ariaDescribedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
    restProps['aria-describedby']
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required ? <span className="text-red-600" aria-label="required">*</span> : null}
        </label>
      ) : null}

      {as === 'textarea' ? (
        <textarea 
          {...restProps} 
          id={inputId} 
          className={common}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : undefined}
        />
      ) : (
        <input 
          {...restProps} 
          id={inputId} 
          className={common}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : undefined}
        />
      )}

      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

