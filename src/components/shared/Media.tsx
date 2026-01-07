"use client"
import Image from 'next/image'
import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'


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
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
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
  layoutId,
  objectFit = 'cover',
}, ref) => {
  const pathname = usePathname()
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState((kind === 'video' && !priority) ? false : (!lazy || priority))
  const [isMounted, setIsMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mobile Optimization State
  const [isMobile, setIsMobile] = useState(false)
  const manualPlayRef = useRef(false)

  // Detect Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const handleMediaChange = () => setPrefersReducedMotion(mediaQuery?.matches ?? false)
    handleMediaChange()
    mediaQuery?.addEventListener('change', handleMediaChange)
    return () => mediaQuery?.removeEventListener('change', handleMediaChange)
  }, [])

  // Track mount state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Force autoplay generally if requested, but respect user motion preference
  // Modern mobile browsers DO support muted autoplay, so we allow it.
  const effectiveAutoplay = autoplay && shouldLoad;

  // Merge forwarded ref (object or callback) with our internal ref so autoplay logic always has a handle
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    internalVideoRef.current = node
    if (!ref) return
    if (typeof ref === 'function') {
      ref(node)
    } else {
      (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node
    }
  }, [ref])

  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  const playIfPossible = useCallback(() => {
    if (kind !== 'video' || !effectiveAutoplay) return
    const el = internalVideoRef.current
    if (!el) return

    // Check if element is connected to DOM
    if (!el.isConnected) return

    if (muted) {
      el.muted = true
      el.defaultMuted = true
    }

    // Force load if not loaded
    if (el.readyState < 2) {
      el.load()
    }

    const playPromise = el.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Only show blocked state if not AbortError (pause was called)
        if (error.name !== 'AbortError') {
          setAutoplayBlocked(true)
          // Show detailed error in development only if NOT AbortError AND NOT NotSupportedError
          if (process.env.NODE_ENV === 'development' && error.name !== 'NotSupportedError') {
            console.group('🎬 Video Autoplay Blocked')
            console.error('Error Name:', error.name)
            console.error('Error Message:', error.message)
            console.log('Video Src:', el.src)
            console.groupEnd()
          }
        }
      })
    }
  }, [kind, effectiveAutoplay, muted])

  // Ref for the container to observe visibility even before video loads
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If not a video or already forcibly loaded, skip lazy logic
    // But we still need observer for AutoPlay logic!
    if (kind !== 'video') return

    const el = containerRef.current
    if (!el) return

    let isPlaying = false

    const onIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 1. Trigger Load if not loaded (with delay to save LCP)
          // Relaxed restriction: Allow mobile to auto-load if visible (muted autoplay usually works)
          if (!shouldLoad && !loadTimerRef.current) {
            // Honey Spot Strategy: Faster Loading (Reduced from 800+jitter)
            // Random delay between 200ms and 500ms
            // This makes the UI feel SNAPPY while still preventing instant hammer.
            const jitter = Math.random() * 300
            loadTimerRef.current = setTimeout(() => {
              setShouldLoad(true)
            }, 200 + jitter)
          }

          // 2. Play if loaded and visible
          if (entry.intersectionRatio > 0 && effectiveAutoplay) {
            if (!isPlaying && internalVideoRef.current) {
              isPlaying = true;
              playIfPossible();
            }
          }
        } else {
          // If scrolled away before loading, cancel the load
          if (loadTimerRef.current) {
            clearTimeout(loadTimerRef.current)
            loadTimerRef.current = null
          }

          // Pause if completely invalid
          if (isPlaying && internalVideoRef.current) {
            isPlaying = false
            internalVideoRef.current.pause()
          }
        }
      })
    }

    const observer = new IntersectionObserver(onIntersect, {
      threshold: 0.25,
      rootMargin: '100px 0px 100px 0px' // Tighter margin to save resources
    })

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current)
      }
    }
  }, [kind, effectiveAutoplay, src, muted, playIfPossible, pathname, shouldLoad, lazy, priority, isMobile])

  // Force autoplay on mount (critical for navigation)
  useEffect(() => {
    if (!isMounted || kind !== 'video' || !effectiveAutoplay) return

    // Multiple attempts with increasing delays
    const timers = [
      setTimeout(() => {
        playIfPossible()
      }, 50),
      setTimeout(() => {
        playIfPossible()
      }, 200),
      setTimeout(() => {
        playIfPossible()
      }, 500)
    ]

    return () => timers.forEach(t => clearTimeout(t))
  }, [isMounted, kind, effectiveAutoplay, playIfPossible, src])

  // Retry playback when source changes or when component mounts (helps after client-side navigation)
  useEffect(() => {
    playIfPossible()
  }, [playIfPossible, src])

  // Trigger autoplay when pathname changes (navigation between pages)
  useEffect(() => {
    if (kind !== 'video' || !effectiveAutoplay) return
    // Small delay to ensure DOM is ready after navigation
    const timer = setTimeout(() => {
      playIfPossible()
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname, kind, effectiveAutoplay, playIfPossible])

  // When returning to the page (tab focus/navigation back), re-attempt autoplay if needed
  useEffect(() => {
    if (kind !== 'video' || !effectiveAutoplay) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        playIfPossible()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [kind, effectiveAutoplay, playIfPossible])

  if (kind === 'video') {
    return (
      <div ref={containerRef} className="relative w-full h-full">
        <video
          ref={setVideoRef}
          className={`${className || "w-full h-full object-cover"} ${!controls ? 'pointer-events-none' : ''}`}
          src={shouldLoad ? src : undefined}
          // poster={poster} -- Removed to prevent "double poster" effect (native vs overlay)
          // We handle the poster via the absolute positioned Image overlay below
          aria-label={controls ? (alt || 'Video content') : undefined}
          title={controls ? (alt || 'Video content') : undefined}
          aria-hidden={!controls ? "true" : undefined}
          tabIndex={!controls ? -1 : undefined}
          autoPlay={effectiveAutoplay}
          // @ts-ignore - React 18.3+ or custom typs
          fetchPriority={priority ? "high" : "auto"}
          muted={effectiveAutoplay || muted} // Force muted if autoplay is on
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload="metadata" // Changed from 'none' to 'metadata' to ensure first frame and dimensions load
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          onCanPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
            setHasError(false)

            // Immediate play attempt if manually requested OR if autoplay is effective
            if (manualPlayRef.current) {
              playIfPossible()
              manualPlayRef.current = false
            } else if (effectiveAutoplay) {
              playIfPossible()
            }
          }}
          onLoadStart={() => {
            setIsLoading(true)
            setHasError(false)
          }}
          onError={(e) => {
            const videoElement = e.currentTarget;
            console.error(
              "Video load error:",
              {
                src,
                error: videoElement.error,
                networkState: videoElement.networkState,
                readyState: videoElement.readyState
              }
            );
            setIsLoading(false)
            setHasError(true)
          }}
          onPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
            setAutoplayBlocked(false) // Hide play button when playing
            setHasError(false)
          }}
        />

        {/* Optimized Poster Image Overlay - Fades out when video plays */}
        {/* Only render if we have a valid poster OR if it's NOT a video (to allow src fallback) */}
        {/* If it's a video and no poster, we prefer showing the native video player (black/first frame) than a broken image */}
        {(poster || kind !== 'video') && (
          <div className={`absolute inset-0 z-10 transition-opacity duration-700 pointer-events-none ${canPlay ? 'opacity-0' : 'opacity-100'}`}>
            <Image
              src={poster || src}
              alt={alt}
              width={width}
              height={height}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
              className={className || "w-full h-full object-cover"}
              placeholder="blur"
              blurDataURL={blurDataURL || generateBlurDataURL()}
              quality={75}
              style={{
                objectFit: objectFit,
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        )}

        {/* Play Button Overlay - Shows when autoplay is blocked OR matches strictly lazy mobile state */}
        {((autoplayBlocked && !hasError) || (isMobile && !shouldLoad)) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer group hover:bg-black/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation() // Prevent parent clicks

              // If not loaded, load it first
              if (!shouldLoad) {
                manualPlayRef.current = true
                setShouldLoad(true)
                return
              }

              const video = internalVideoRef.current
              if (video) {
                video.play()
                  .then(() => {
                    setAutoplayBlocked(false)
                  })
                  .catch((err) => {
                    console.error('Manual play failed:', err)
                  })
              }
            }}
            title="Click to play video"
          >
            <div className={`bg-white/95 rounded-full shadow-2xl transition-transform ${shouldLoad ? 'p-5 group-hover:scale-110' : 'p-6 scale-110'}`}>
              <svg
                className={`${shouldLoad ? 'w-12 h-12' : 'w-16 h-16'} text-black`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

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
        fetchPriority={priority ? 'high' : 'auto'}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={className}
        placeholder="blur"
        blurDataURL={defaultBlurDataURL}
        quality={90} // Increased from 75 to 90 for "Retina-like" sharpness
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
