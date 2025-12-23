"use client"
import { useEffect, useState } from 'react'

type Props = {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning' | 'saving' | 'saved'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: Props){
  const [show, setShow] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(()=>{
    setIsAnimating(true)
    const t = setTimeout(()=>{ 
      setShow(false)
      setTimeout(() => {
        onClose && onClose()
      }, 300) // Wait for animation to complete
    }, duration)
    return ()=> clearTimeout(t)
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
      case 'saved':
        return {
          bg: 'bg-emerald-600 text-white',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          animation: 'animate-bounce'
        }
      case 'error':
        return {
          bg: 'bg-red-600 text-white',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          animation: 'animate-pulse'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-600 text-white',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          animation: 'animate-pulse'
        }
      case 'saving':
        return {
          bg: 'bg-blue-600 text-white',
          icon: (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          animation: 'animate-pulse'
        }
      default:
        return {
          bg: 'bg-gray-900 text-white',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          animation: ''
        }
    }
  }

  const styles = getToastStyles()
  const ariaRole = (type === 'error' || type === 'warning') ? 'alert' : 'status'
  const ariaLive = (type === 'error' || type === 'warning') ? 'assertive' : 'polite'

  return (
    <div 
      role={ariaRole}
      aria-live={ariaLive}
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out ${
      show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
    }`}
    >
      <div className={`px-4 py-3 rounded-lg shadow-xl ${styles.bg} max-w-sm text-sm flex items-center gap-3 ${
        isAnimating ? styles.animation : ''
      }`}>
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="flex-1">
          {message}
        </div>
        <button
          onClick={() => {
            setShow(false)
            setTimeout(() => onClose && onClose(), 300)
          }}
          aria-label="Close notification"
          className="flex-shrink-0 ml-2 hover:bg-black hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
