'use client'

import Button from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface ErrorFallbackProps {
  error: Error | string
  resetError?: () => void
  className?: string
}

export function ErrorFallback({ error, resetError, className = '' }: ErrorFallbackProps) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.message || 'An unexpected error occurred'

  return (
    <div className={`p-6 ${className}`}>
      <Alert>
        <div className="flex flex-col space-y-4">
          <div>
            <h3 className="font-semibold text-red-800">Something went wrong</h3>
            <p className="text-red-700 mt-1">{errorMessage}</p>
          </div>
          
          {resetError && (
            <div className="flex space-x-3">
              <Button 
                onClick={resetError}
                variant="secondary"
                size="sm"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          )}
        </div>
      </Alert>
    </div>
  )
}

export function ComponentErrorFallback({ error, resetError }: { error: string; resetError: () => void }) {
  return (
    <ErrorFallback 
      error={error} 
      resetError={resetError}
      className="min-h-[400px] flex items-center justify-center"
    />
  )
}

export function PageErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <ErrorFallback 
          error={error}
          className="text-center"
        />
      </div>
    </div>
  )
}
