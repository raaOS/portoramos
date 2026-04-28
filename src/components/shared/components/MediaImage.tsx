"use client"
import Image from 'next/image'
import { useState } from 'react'
import { getProxiedUrl } from '@/lib/utils'

export type MediaImageProps = {
  src: string
  alt?: string
  className?: string
  sizes?: string
  priority?: boolean
  eager?: boolean
  lazy?: boolean
  width?: number
  height?: number
  blurDataURL?: string
  quality?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export default function MediaImage({
  src,
  alt = '',
  className,
  sizes,
  priority = false,
  eager = false,
  lazy,
  width = 1600,
  height = 1000,
  blurDataURL,
  quality,
  objectFit = 'cover',
}: MediaImageProps) {
  const shouldLoadEagerly = priority || eager || lazy === false
  const [isLoading, setIsLoading] = useState(!priority)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative w-full h-full bg-neutral-200 dark:bg-neutral-900 overflow-hidden">
      <Image
        src={getProxiedUrl(src)}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={shouldLoadEagerly ? 'eager' : 'lazy'}
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        quality={quality || 75}
        style={{
          objectFit: objectFit,
          width: '100%',
          height: '100%'
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
      {isLoading && !priority && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-900 animate-pulse" />
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-200 dark:bg-neutral-900 text-gray-400 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">{alt || 'Image Unavailable'}</span>
        </div>
      )}
    </div>
  )
}
