"use client"
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400 disabled:opacity-70',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-70',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400 disabled:opacity-70',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-lg',
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-disabled={isDisabled ? 'true' : 'false'}
      aria-busy={loading ? 'true' : 'false'}
      className={`inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
        variants[variant]
      } ${sizes[size]} ${isDisabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <>
          <svg 
            className="w-4 h-4 mr-2 animate-spin" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M4 12a8 8 0 0 1 8-8" className="opacity-75" />
          </svg>
          <span className="sr-only">Loading...</span>
        </>
      ) : null}
      {children}
    </button>
  )
}

