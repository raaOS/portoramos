import React from 'react'

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white rounded-lg border ${className}`}>{children}</div>
}

export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-6 border-b border-gray-200 ${className}`}>{children}</div>
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
}

export function CardDescription({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
}

export function CardContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function CardFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-6 border-t border-gray-200 ${className}`}>{children}</div>
}

export default Card

