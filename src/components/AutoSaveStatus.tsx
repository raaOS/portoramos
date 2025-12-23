"use client"
import { useEffect, useState } from 'react'

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
}

export function AutoSaveStatus({ status, lastSaved, hasUnsavedChanges }: AutoSaveStatusProps) {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return {
          text: 'Saving...',
          icon: (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          className: 'text-blue-600'
        }
      case 'saved':
      case 'idle':
        if (showSaved || status === 'saved') {
          return {
            text: 'Saved',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ),
            className: 'text-green-600'
          }
        }
        if (hasUnsavedChanges) {
          return {
            text: 'Unsaved changes',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ),
            className: 'text-yellow-600'
          }
        }
        return {
          text: lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : 'All changes saved',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          className: 'text-gray-500'
        }
      case 'error':
        return {
          text: 'Save failed',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          className: 'text-red-600'
        }
      default:
        return {
          text: '',
          icon: null,
          className: ''
        }
    }
  }

  const statusContent = getStatusContent()

  if (!statusContent.text) return null

  return (
    <div className={`flex items-center gap-2 text-sm ${statusContent.className}`}>
      {statusContent.icon}
      <span>{statusContent.text}</span>
    </div>
  )
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) {
    return 'just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}