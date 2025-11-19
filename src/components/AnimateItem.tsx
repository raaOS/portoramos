"use client"
import { useEffect, useRef, useState } from 'react'

export default function AnimateItem({ i = 0, children }: { i?: number; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(i < 3) // Show first 3 items immediately
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Skip animation for first 3 items
    if (i < 3) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [i])

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}
      style={{ 
        transitionDelay: i < 3 ? '0ms' : `${Math.min((i - 3) * 50, 300)}ms` 
      }}
    >
      {children}
    </div>
  )
}

