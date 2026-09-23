'use client';

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getProxiedUrl } from '@/lib/utils';
import { sharedMediaObserver } from '../utils/MediaObserver';
import { VideoPosterOverlay } from './media-video/VideoPosterOverlay';
import { VideoPlayButtonOverlay } from './media-video/VideoPlayButtonOverlay';
import { generateBlurDataURL } from './media-video/blurPlaceholder';

export type MediaVideoProps = {
  src: string;
  alt?: string;
  poster?: string;
  posterPriority?: boolean;
  eager?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  blurDataURL?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  lazy?: boolean;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
};

const MediaVideo = forwardRef<HTMLVideoElement, MediaVideoProps>(
  (
    {
      src,
      alt = '',
      poster,
      posterPriority,
      eager = false,
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
    },
    ref
  ) => {
    const pathname = usePathname();
    const internalVideoRef = useRef<HTMLVideoElement | null>(null);
    const [canPlay, setCanPlay] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(!lazy);
    const [isMounted, setIsMounted] = useState(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);
    // Mute state ditarik dari props ke local state supaya saat user pakai
    // controls untuk unmute, kita tidak overwrite preferensi user setiap re-render.
    const [isMuted, setIsMuted] = useState(autoplay ? true : muted);
    const userInteractedRef = useRef(false);
    const [isMobile, setIsMobile] = useState(() => {
      if (typeof window !== 'undefined') return window.innerWidth < 768;
      return false;
    });

    const manualPlayRef = useRef(false);
    const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const effectivePosterPriority = posterPriority ?? priority;
    const shouldLoadPosterEagerly = effectivePosterPriority || eager;

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile((prev) => (prev === mobile ? prev : mobile));
      };
      const debouncedResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(checkMobile, 150);
      };
      window.addEventListener('resize', debouncedResize);
      return () => {
        window.removeEventListener('resize', debouncedResize);
        clearTimeout(timeoutId);
      };
    }, []);

    useEffect(() => {
      requestAnimationFrame(() => setIsMounted(true));
      return () => setIsMounted(false);
    }, []);

    const setVideoRef = useCallback(
      (node: HTMLVideoElement | null) => {
        internalVideoRef.current = node;
        if (!ref) return;
        if (typeof ref === 'function') ref(node);
        else (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
      },
      [ref]
    );

    const effectiveAutoplay = autoplay && shouldLoad;

    const playIfPossible = useCallback(() => {
      if (!effectiveAutoplay) return;
      if (userInteractedRef.current) return;
      const el = internalVideoRef.current;
      if (!el || !el.isConnected) return;
      if (isMuted) {
        el.muted = true;
        el.defaultMuted = true;
      }
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError' && error.name !== 'NotSupportedError') {
            setAutoplayBlocked(true);
          }
        });
      }
    }, [effectiveAutoplay, isMuted]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      let isPlaying = false;
      const handleIntersect = (entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          if (!shouldLoad && !loadTimerRef.current) {
            const jitter = Math.random() * 200;
            loadTimerRef.current = setTimeout(() => {
              setShouldLoad(true);
            }, 100 + jitter);
          }
          if (entry.intersectionRatio > 0 && effectiveAutoplay) {
            if (!isPlaying && internalVideoRef.current) {
              isPlaying = true;
              playIfPossible();
            }
          }
        } else {
          if (loadTimerRef.current) {
            clearTimeout(loadTimerRef.current);
            loadTimerRef.current = null;
          }
          if (isPlaying && internalVideoRef.current) {
            isPlaying = false;
            if (!userInteractedRef.current) {
              internalVideoRef.current.pause();
            }
          }
        }
      };
      sharedMediaObserver.observe(el, handleIntersect);
      return () => {
        sharedMediaObserver.unobserve(el);
        if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
      };
    }, [effectiveAutoplay, shouldLoad, playIfPossible]);

    useEffect(() => {
      if (!isMounted || !effectiveAutoplay) return;
      const t = setTimeout(playIfPossible, 200);
      return () => clearTimeout(t);
    }, [isMounted, effectiveAutoplay, playIfPossible]);

    useEffect(() => {
      if (effectiveAutoplay && document.visibilityState === 'visible') playIfPossible();
    }, [pathname, effectiveAutoplay, playIfPossible]);

    useEffect(() => {
      if (userInteractedRef.current) return;
      setIsMuted(autoplay ? true : muted);
    }, [autoplay, muted]);

    const handleManualPlay = useCallback(() => {
      userInteractedRef.current = true;
      if (!shouldLoad) {
        manualPlayRef.current = true;
        setShouldLoad(true);
        return;
      }
      const el = internalVideoRef.current;
      if (!el) return;
      setAutoplayBlocked(false);
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          el.muted = true;
          setIsMuted(true);
          el.play().catch(() => {});
        });
      }
    }, [shouldLoad]);

    const markUserInteraction = useCallback(() => {
      userInteractedRef.current = true;
    }, []);

    return (
      <div ref={containerRef} className="relative h-full w-full bg-neutral-200 dark:bg-neutral-900">
        <video
          ref={setVideoRef}
          className={`${className || 'h-full w-full object-cover'} ${
            autoplayBlocked && !canPlay ? 'pointer-events-none' : ''
          }`}
          src={shouldLoad ? getProxiedUrl(src) : undefined}
          aria-label={controls ? alt || 'Video content' : undefined}
          title={controls ? alt || 'Video content' : undefined}
          aria-hidden={!controls ? 'true' : undefined}
          tabIndex={!controls ? -1 : undefined}
          autoPlay={effectiveAutoplay}
          // @ts-expect-error - fetchPriority attribute exists in modern browsers
          fetchPriority={priority ? 'high' : 'auto'}
          muted={isMuted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload={shouldLoad ? 'metadata' : 'none'}
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          onCanPlay={() => {
            setCanPlay(true);
            setHasError(false);
            if (manualPlayRef.current) {
              playIfPossible();
              manualPlayRef.current = false;
            } else if (effectiveAutoplay && !userInteractedRef.current) {
              playIfPossible();
            }
          }}
          onLoadStart={() => {
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
          }}
          onPlay={() => {
            setCanPlay(true);
            setAutoplayBlocked(false);
            setHasError(false);
          }}
          onPause={markUserInteraction}
          onVolumeChange={() => {
            const el = internalVideoRef.current;
            if (!el) return;
            if (el.muted !== isMuted) {
              userInteractedRef.current = true;
              setIsMuted(el.muted);
            }
          }}
        />

        {poster && (
          <VideoPosterOverlay
            poster={poster}
            alt={alt}
            width={width}
            height={height}
            effectivePosterPriority={effectivePosterPriority}
            shouldLoadPosterEagerly={shouldLoadPosterEagerly}
            sizes={sizes}
            className={className}
            blurDataURL={blurDataURL || generateBlurDataURL()}
            quality={quality}
            objectFit={objectFit}
            canPlay={canPlay}
          />
        )}

        {((autoplayBlocked && !hasError) || ((isMobile as boolean) && !shouldLoad)) && (
          <VideoPlayButtonOverlay shouldLoad={shouldLoad} onManualPlay={handleManualPlay} />
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-200 p-4 text-center text-gray-400 dark:bg-neutral-900">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
              {alt || 'Media Unavailable'}
            </span>
          </div>
        )}
      </div>
    );
  }
);

MediaVideo.displayName = 'MediaVideo';
export default MediaVideo;
