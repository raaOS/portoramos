"use client"

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    // a11y.skipToContent(targetId) // Simplified for now
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-blue-600 text-white px-4 py-2 rounded-md z-50 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </a>
  )
}

// Screen reader only utility class component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// Focus indicator wrapper
interface FocusRingProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

export function FocusRing({ children, className = '', visible = true }: FocusRingProps) {
  return (
    <div
      className={`
        ${visible ? 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2' : ''}
        rounded-md transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}