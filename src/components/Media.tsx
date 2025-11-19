"use client"
import Image from 'next/image'
import { useEffect, useRef, useState, forwardRef } from 'react'


export type MediaProps = {
  kind: 'image' | 'video'
  src: string
  alt?: string
  poster?: string
  className?: string
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
  blurDataURL?: string
  // video controls
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  controls?: boolean
  lazy?: boolean
  layoutId?: string
  ref?: React.Ref<HTMLVideoElement>
}

// Generate a simple blur placeholder
const generateBlurDataURL = (width: number = 8, height: number = 6): string => {
  // Always return fallback base64 blur for consistency
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
}

const Media = forwardRef<HTMLVideoElement, MediaProps>(({ 
  kind, 
  src, 
  alt = '', 
  poster, 
  className, 
  sizes, 
  priority = false, 
  width = 1600, 
  height = 1000,
  blurDataURL,
  autoplay = true, 
  muted = true, 
  loop = true, 
  playsInline = true, 
  controls = false,
  lazy = false,
  layoutId 
}, ref) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)
  const videoRef = ref || internalVideoRef
  const [canPlay, setCanPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad] = useState(true)

  useEffect(() => {
    if (kind !== 'video' || !autoplay) return
    const el = (videoRef as React.RefObject<HTMLVideoElement>)?.current
    if (!el) return
    
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReduced) {
      return
    }

    let isPlaying = false

    const onIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          if (!isPlaying) {
            isPlaying = true
            el.play().catch((error) => {
              isPlaying = false
              console.log('Video autoplay failed:', error)
            })
          }
        } else {
          if (isPlaying) {
            isPlaying = false
            el.pause()
          }
        }
      })
    }

    const observer = new IntersectionObserver(onIntersect, { 
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '0px 0px 200px 0px'
    })
    
    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [kind, autoplay, src, videoRef])

  if (kind === 'video') {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          className={className || "w-full h-full object-cover"}
          src={shouldLoad ? src : undefined}
          poster={poster}
          autoPlay={autoplay && shouldLoad}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload={lazy ? "none" : "metadata"}
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          onCanPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
            // Immediate play attempt when video is ready
            if (autoplay && (videoRef as React.RefObject<HTMLVideoElement>)?.current) {
              console.log('Video can play - attempting immediate play')
              ;(videoRef as React.RefObject<HTMLVideoElement>).current!.play().catch((error) => {
                console.log('Video immediate play failed:', error)
              })
            }
          }}
          onLoadStart={() => setIsLoading(true)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          onPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
          }}
        />

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
            <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Video tidak dapat dimuat</span>
          </div>
        )}
      </div>
    )
  }
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL()
  
  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={className}
        placeholder="blur"
        blurDataURL={defaultBlurDataURL}
        quality={90}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: 'auto'
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">Gambar tidak dapat dimuat</span>
        </div>
      )}
    </div>
  )
})

Media.displayName = 'Media'

export default Media
