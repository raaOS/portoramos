"use client"
import Image from 'next/image'
import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { getProxiedUrl } from '@/lib/utils'
import { sharedMediaObserver } from '../utils/MediaObserver'

export type MediaVideoProps = {
  src: string
  alt?: string
  poster?: string
  posterPriority?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
  blurDataURL?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  controls?: boolean
  lazy?: boolean
  quality?: number
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

const generateBlurDataURL = (_width: number = 8, _height: number = 6): string => {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
}

const MediaVideo = forwardRef<HTMLVideoElement, MediaVideoProps>(({
  src,
  alt = '',
  poster,
  posterPriority,
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
  quality,
  objectFit = 'cover',
}, ref) => {
  const pathname = usePathname()
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy)
  const [isMounted, setIsMounted] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });
  
  const manualPlayRef = useRef(false)
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const effectivePosterPriority = posterPriority ?? priority

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(prev => prev === mobile ? prev : mobile);
    }
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => setIsMounted(true))
    return () => setIsMounted(false)
  }, [])

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    internalVideoRef.current = node
    if (!ref) return
    if (typeof ref === 'function') ref(node)
    else (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node
  }, [ref])

  const effectiveAutoplay = autoplay && shouldLoad;

  const playIfPossible = useCallback(() => {
    if (!effectiveAutoplay) return
    const el = internalVideoRef.current
    if (!el || !el.isConnected) return
    if (muted) {
      el.muted = true
      el.defaultMuted = true
    }
    const playPromise = el.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error.name !== 'AbortError' && error.name !== 'NotSupportedError') {
          setAutoplayBlocked(true)
        }
      })
    }
  }, [effectiveAutoplay, muted])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let isPlaying = false
    const handleIntersect = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        if (!shouldLoad && !loadTimerRef.current) {
          const jitter = Math.random() * 200
          loadTimerRef.current = setTimeout(() => {
            setShouldLoad(true)
          }, 100 + jitter)
        }
        if (entry.intersectionRatio > 0 && effectiveAutoplay) {
          if (!isPlaying && internalVideoRef.current) {
            isPlaying = true;
            playIfPossible();
          }
        }
      } else {
        if (loadTimerRef.current) {
          clearTimeout(loadTimerRef.current)
          loadTimerRef.current = null
        }
        if (isPlaying && internalVideoRef.current) {
          isPlaying = false;
          internalVideoRef.current.pause();
        }
      }
    }
    sharedMediaObserver.observe(el, handleIntersect);
    return () => {
      sharedMediaObserver.unobserve(el);
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    }
  }, [effectiveAutoplay, shouldLoad, playIfPossible])

  useEffect(() => {
    if (!isMounted || !effectiveAutoplay) return
    const t = setTimeout(playIfPossible, 200);
    return () => clearTimeout(t);
  }, [isMounted, effectiveAutoplay, playIfPossible])

  useEffect(() => {
    if (effectiveAutoplay && document.visibilityState === 'visible') playIfPossible();
  }, [pathname, effectiveAutoplay, playIfPossible])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-neutral-200 dark:bg-neutral-900">
      <video
        ref={setVideoRef}
        className={`${className || "w-full h-full object-cover"} ${!controls ? 'pointer-events-none' : ''}`}
        src={shouldLoad ? getProxiedUrl(src) : undefined}
        aria-label={controls ? (alt || 'Video content') : undefined}
        title={controls ? (alt || 'Video content') : undefined}
        aria-hidden={!controls ? "true" : undefined}
        tabIndex={!controls ? -1 : undefined}
        autoPlay={effectiveAutoplay}
        // @ts-expect-error - fetchPriority attribute exists in modern browsers
        fetchPriority={priority ? "high" : "auto"}
        muted={effectiveAutoplay || muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={shouldLoad || priority ? "metadata" : "none"}
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        onCanPlay={() => {
          setCanPlay(true)
          setHasError(false)
          if (manualPlayRef.current) {
            playIfPossible()
            manualPlayRef.current = false
          } else if (effectiveAutoplay) {
            playIfPossible()
          }
        }}
        onLoadStart={() => {
          setHasError(false)
        }}
        onError={() => {
          setHasError(true)
        }}
        onPlay={() => {
          setCanPlay(true)
          setAutoplayBlocked(false)
          setHasError(false)
        }}
      />

      {(poster || src) && (
        <div className={`absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none ${canPlay ? 'opacity-0' : 'opacity-100'}`}>
          <Image
            src={getProxiedUrl(poster || src)}
            alt={alt}
            width={width}
            height={height}
            priority={effectivePosterPriority}
            loading={effectivePosterPriority ? 'eager' : 'lazy'}
            fetchPriority={effectivePosterPriority ? 'high' : 'auto'}
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

      {((autoplayBlocked && !hasError) || ((isMobile as boolean) && !shouldLoad)) && (
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
        >
          <div className={`bg-white/95 rounded-full shadow-2xl transition-transform ${shouldLoad ? 'p-5 group-hover:scale-110' : 'p-6 scale-110'}`}>
            <svg className={`${shouldLoad ? 'w-12 h-12' : 'w-16 h-16'} text-black`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-200 dark:bg-neutral-900 text-gray-400 p-4 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">{alt || 'Media Unavailable'}</span>
        </div>
      )}
    </div>
  )
})

MediaVideo.displayName = 'MediaVideo'
export default MediaVideo
