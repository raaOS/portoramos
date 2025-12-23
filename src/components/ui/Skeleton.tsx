"use client"
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'rectangle'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({ 
  className, 
  variant = 'rectangle', 
  width, 
  height, 
  animate = true,
  ...props 
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  const animateClasses = animate ? 'animate-pulse' : ''
  
  const variantClasses = {
    card: 'rounded-lg',
    text: 'rounded h-4',
    circle: 'rounded-full',
    rectangle: 'rounded'
  }

  const style = {
    width: width || undefined,
    height: height || undefined
  }

  return (
    <div
      className={cn(
        baseClasses,
        animateClasses,
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

// Specific skeleton components
export function ProjectCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="card" className="aspect-[4/3] w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  )
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton variant="text" className="w-3/4 h-8" />
        <Skeleton variant="text" className="w-1/2 h-6" />
      </div>
      
      {/* Main image */}
      <Skeleton variant="card" className="aspect-video w-full" />
      
      {/* Description */}
      <div className="space-y-3">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
      
      {/* Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="aspect-square" />
        ))}
      </div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <Skeleton variant="text" className="w-24 h-8" />
      <div className="flex items-center space-x-4">
        <Skeleton variant="text" className="w-16 h-6" />
        <Skeleton variant="text" className="w-16 h-6" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
    </div>
  )
}

export default Skeleton