import React from 'react'

interface AlertProps {
  children: React.ReactNode
  className?: string
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function Alert({ children, className = '' }: AlertProps) {
  return (
    <div className={`rounded-md border p-4 ${className}`}>
      {children}
    </div>
  )
}

export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  )
}

