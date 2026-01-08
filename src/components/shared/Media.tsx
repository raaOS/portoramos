"use client"
import Image from 'next/image'
import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

// Shared Observer Manager to prevent memory leaks (1 observer instead of N)
class SharedObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, (entry: IntersectionObserverEntry) => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const cb = this.callbacks.get(entry.target);
          if (cb) cb(entry);
        });
      }, {
        threshold: 0.25,
        rootMargin: '100px 0px 100px 0px'
      });
    }
  }

  observe(element: Element, callback: (entry: IntersectionObserverEntry) => void) {
    if (!this.observer) return;
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    if (!this.observer) return;
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }
}

// Singleton instance
const sharedMediaObserver = new SharedObserver();

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
  quality?: number
  layoutId?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  ref?: React.Ref<HTMLVideoElement>
}

// Generate a simple blur placeholder
const generateBlurDataURL = (width: number = 8, height: number = 6): string => {
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
  quality,
  objectFit = 'cover',
}, ref) => {
  const pathname = usePathname()
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState((kind === 'video' && !priority) ? false : (!lazy || priority))
  const [isMounted, setIsMounted] = useState(false)

  // No state for reduceMotion to avoid re-renders. Read direct if needed or just assume false for perf.

  // Mobile Optimization State
  const [isMobile, setIsMobile] = useState(false)
  const manualPlayRef = useRef(false)
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null)

  // [STICKY NOTE] MOBILE OPTIMIZATION
  // Mendeteksi apakah user menggunakan HP (layar kecil < 768px).
  // Gunanya: Kita bisa mematikan fitur berat (seperti auto-play video banyak) di HP agar tidak lag.
  // Menggunakan "Debounce" agar tidak menghitung ulang terus-menerus saat layar diputar/diubah.
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(prev => prev === mobile ? prev : mobile); // Only update if changed
    }

    // Initial check
    checkMobile();

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150); // 150ms debounce
    };

    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Track mount state
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const effectiveAutoplay = autoplay && shouldLoad;

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
    if (!el || !el.isConnected) return

    if (muted) {
      el.muted = true
      el.defaultMuted = true
    }

    const playPromise = el.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error.name !== 'AbortError') {
          // Only flag blocked if we really expected it to play (e.g. user interacting or muted)
          // Silent fail is better for perf than state thrashing
          if (error.name !== 'NotSupportedError') {
            setAutoplayBlocked(true)
          }
        }
      })
    }
  }, [kind, effectiveAutoplay, muted])

  // Ref for the container to observe
  const containerRef = useRef<HTMLDivElement>(null)

  // Fix #1: Shared Intersection Observer
  useEffect(() => {
    if (kind !== 'video') return

    const el = containerRef.current
    if (!el) return

    let isPlaying = false

    const handleIntersect = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        // Trigger Load
        if (!shouldLoad && !loadTimerRef.current) {
          // Short random delay to smooth out network bursts
          const jitter = Math.random() * 200
          loadTimerRef.current = setTimeout(() => {
            setShouldLoad(true)
          }, 100 + jitter)
        }

        // Play if visible
        if (entry.intersectionRatio > 0 && effectiveAutoplay) {
          if (!isPlaying && internalVideoRef.current) {
            isPlaying = true;
            playIfPossible();
          }
        }
      } else {
        // Cancel load if scrolled away rapidly
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current)
          loadTimerRef.current = null
        }

        // Pause if offscreen
        if (isPlaying && internalVideoRef.current) {
          isPlaying = false;
          internalVideoRef.current.pause();
        }
      }
    }

    sharedMediaObserver.observe(el, handleIntersect);

    return () => {
      sharedMediaObserver.unobserve(el);
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current)
      }
    }
  }, [kind, effectiveAutoplay, shouldLoad, playIfPossible])

  // Fix #2: Optimize Autoplay (Remove thrashing timers)
  // Instead of 3 timers, rely on 'canPlay' event and single visibility check
  useEffect(() => {
    if (!isMounted || kind !== 'video' || !effectiveAutoplay) return
    // One polite attempt after mount
    const t = setTimeout(playIfPossible, 200);
    return () => clearTimeout(t);
  }, [isMounted, kind, effectiveAutoplay, playIfPossible])

  // Navigation recovery
  useEffect(() => {
    if (kind === 'video' && effectiveAutoplay) {
      // Checking visibilityState is cheap
      if (document.visibilityState === 'visible') playIfPossible();
    }
  }, [pathname, kind, effectiveAutoplay, playIfPossible])


  if (kind === 'video') {
    return (
      <div ref={containerRef} className="relative w-full h-full">
        <video
          ref={setVideoRef}
          className={`${className || "w-full h-full object-cover"} ${!controls ? 'pointer-events-none' : ''}`}
          src={shouldLoad ? src : undefined}
          aria-label={controls ? (alt || 'Video content') : undefined}
          title={controls ? (alt || 'Video content') : undefined}
          aria-hidden={!controls ? "true" : undefined}
          tabIndex={!controls ? -1 : undefined}
          autoPlay={effectiveAutoplay}
          // @ts-ignore
          fetchPriority={priority ? "high" : "auto"}
          muted={effectiveAutoplay || muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload="metadata"
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          onCanPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
            setHasError(false)

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
            setIsLoading(false)
            setHasError(true)
          }}
          onPlay={() => {
            setCanPlay(true)
            setIsLoading(false)
            setAutoplayBlocked(false)
            setHasError(false)
          }}
        />

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
              quality={quality || 75}
              style={{
                objectFit: objectFit,
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        )}

        {((autoplayBlocked && !hasError) || (isMobile && !shouldLoad)) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer group hover:bg-black/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              if (!shouldLoad) {
                manualPlayRef.current = true
                setShouldLoad(true)
                return
              }
              playIfPossible()
            }}
            title="Click to play video"
          >
            <div className={`bg-white/95 rounded-full shadow-2xl transition-transform ${shouldLoad ? 'p-5 group-hover:scale-110' : 'p-6 scale-110'}`}>
              <svg className={`${shouldLoad ? 'w-12 h-12' : 'w-16 h-16'} text-black`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">{alt || 'Media Unavailable'}</span>
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
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">{alt || 'Image Unavailable'}</span>
        </div>
      )}
    </div>
  )
})

Media.displayName = 'Media'

export default Media
