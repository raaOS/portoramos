'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { m, useReducedMotion, type Transition } from 'motion/react';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../utils/zIndexLayers';
import { getVideoPosterCandidates, isVideoSource } from '@/lib/mediaPreview';
import { useBackgroundEffect } from '@/components/home/BackgroundEffectContext';

interface DesktopBackgroundProps {
  wallpaperConfig?: WallpaperConfig;
  isWindowOpen?: boolean;
  isMobile?: boolean;
}

/**
 * Optimized Desktop Background for LCP
 * Uses priority loading for active wallpaper
 */
export default function DesktopBackground({
  wallpaperConfig,
  isWindowOpen = false,
  isMobile = false,
}: DesktopBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const { isDesktopRevealed } = useBackgroundEffect();

  // Resolve the active wallpaper entry (not just URL) so we can also
  // pick up the side-car poster image if the upload pipeline produced
  // one. Falls back to the JPG side-car convention (`<base>.jpg`) when
  // posterUrl wasn't persisted on older entries.
  const activeEntry = useMemo(() => {
    if (!wallpaperConfig?.activeWallpaperId) return null;
    return (
      wallpaperConfig.collection?.find((w) => w.id === wallpaperConfig.activeWallpaperId) ?? null
    );
  }, [wallpaperConfig]);

  const activeWallpaper = useMemo(() => {
    const resolved = activeEntry?.url;
    const isValidUrl = resolved && (resolved.startsWith('/') || resolved.startsWith('http'));
    return isValidUrl ? resolved : DEFAULT_WALLPAPER_URL;
  }, [activeEntry]);

  const blurAmount = wallpaperConfig?.blur || 0;
  const isVideo = useMemo(() => isVideoSource(activeWallpaper), [activeWallpaper]);

  const videoSrc = useMemo(() => {
    if (!isVideo) return activeWallpaper;
    if (activeEntry?.startTime !== undefined) {
      const baseUrl = activeWallpaper.split('#')[0];
      return `${baseUrl}#t=${activeEntry.startTime}`;
    }
    if (activeWallpaper.includes('#t=')) return activeWallpaper;
    return `${activeWallpaper}#t=14`;
  }, [activeWallpaper, isVideo, activeEntry]);

  // Poster candidates: explicit `posterUrl` from D1 wins (current
  // pipeline always persists it for new wallpapers). Otherwise we
  // derive `[<base>.jpg, <base>.webp]` — `.jpg` is the current
  // convention, `.webp` is the legacy era.
  //
  // Caveat we do NOT solve here: when there are multiple candidates,
  // a wallpaper entry from the .webp era pays one 404 round trip per
  // cold load. The proper fix is backfilling `posterUrl` on those
  // D1 entries via
  // `scripts/cloudflare/backfill-wallpaper-poster-urls.ts`.
  const posterCandidates = useMemo(() => {
    if (!isVideo) return [] as string[];
    if (activeEntry?.posterUrl) return [activeEntry.posterUrl];
    return getVideoPosterCandidates(activeWallpaper);
  }, [isVideo, activeEntry, activeWallpaper]);

  // The seed is candidates[0] — used synchronously for the initial
  // <video poster> so the happy path (posterUrl persisted, .jpg side-
  // car exists) renders with 0 extra round trips.
  const seedPoster = posterCandidates[0];

  // Probe override: set asynchronously by the effect below ONLY when
  // a later candidate (e.g. .webp) loads after the seed (.jpg) 404s.
  // Tagged with `forSeed` so a stale override from a previous wallpaper
  // is automatically ignored when the seed changes (no synchronous
  // setState-in-effect required to reset).
  const [probedOverride, setProbedOverride] = useState<{ url: string; forSeed: string } | null>(
    null
  );

  // Derive the poster URL: prefer the override if it was resolved for
  // the current seed, otherwise the seed itself.
  //
  // Edge case: untuk image wallpaper, `seedPoster` dan `probedOverride`
  // sama-sama undefined/null. Tanpa explicit null-check, ekspresi
  // `probedOverride?.forSeed === seedPoster` menghasilkan
  // `undefined === undefined` (true) → akses `.url` ke null = crash.
  // Karena itu kita require `probedOverride` truthy dulu.
  const posterUrl =
    probedOverride && probedOverride.forSeed === seedPoster ? probedOverride.url : seedPoster;

  const [videoReady, setVideoReady] = useState(false);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  useEffect(() => {
    // Skip probe when a single candidate exists. Either we have an
    // explicit posterUrl from D1 (trusted) or no candidates at all
    // (non-video).
    if (typeof window === 'undefined') return;
    if (posterCandidates.length <= 1) return;

    const seed = posterCandidates[0];
    let cancelled = false;
    let activeImg: HTMLImageElement | null = null;

    const tryNext = (index: number) => {
      if (cancelled) return;
      if (index >= posterCandidates.length) return;
      const url = posterCandidates[index];
      const img = new window.Image();
      activeImg = img;
      img.onload = () => {
        if (cancelled) return;
        // Only override if probe found a candidate other than the
        // seed (which is already the default). Avoids a redundant
        // state update for the happy path where candidates[0] succeeds.
        if (url !== seed) {
          setProbedOverride({ url, forSeed: seed });
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        tryNext(index + 1);
      };
      img.src = url;
    };

    // Start from index 1 — index 0 (seed) is already loaded by
    // `<video poster={posterUrl}>` above. Probing it again via
    // `new Image()` creates a redundant HTTP request.
    tryNext(1);

    return () => {
      cancelled = true;
      if (activeImg) {
        activeImg.onload = null;
        activeImg.onerror = null;
        activeImg.src = '';
      }
    };
  }, [posterCandidates]);

  // Bandwidth-aware playback decision.
  //
  //   1. `prefers-reduced-data` (`navigator.connection.saveData`) → user
  //      has explicitly opted into low-data mode (e.g. iOS Low Data
  //      mode, Android Data Saver). Show poster only, never download
  //      the MP4.
  //   2. Effective connection type `2g` / `slow-2g` → assume metered or
  //      degraded mobile network. Show poster only.
  //   3. Otherwise stream the full MP4 with `preload="metadata"` so the
  //      browser only fetches enough bytes to start playback rather
  //      than the entire file up front.
  //
  // We re-evaluate when the connection changes (Network Information API
  // emits `change`) so a user who switches from wifi → cellular gets
  // downgraded automatically without a reload.
  //
  // CRITICAL: initial value via lazy useState init agar evaluasi
  // saveData/2g terjadi SEBELUM render pertama. Sebelumnya pakai
  // `useState(true)` + effect → first render selalu mount <video>
  // dengan `preload="metadata"`, browser kicks off metadata fetch
  // (~5-10KB) walaupun visitor di mode saveData/2g. Effect baru
  // re-render switch ke <Image> SETELAH fetch sudah ke-trigger. Lazy
  // init pre-empt seluruh waste itu.
  const [shouldPlayVideo, setShouldPlayVideo] = useState(() => {
    if (typeof navigator === 'undefined') return true; // SSR safe default
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (!conn) return true;
    const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
    return !conn.saveData && !slow;
  });

  // Defer video streaming on desktop slightly so <Image> achieves super-fast LCP without network contention
  const [videoDeferredReady, setVideoDeferredReady] = useState(false);
  useEffect(() => {
    if (!isVideo || isMobile || prefersReducedMotion || !isDesktopRevealed) return;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => setVideoDeferredReady(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      const tid = setTimeout(() => setVideoDeferredReady(true), 800);
      return () => clearTimeout(tid);
    }
  }, [isVideo, isMobile, prefersReducedMotion, isDesktopRevealed]);

  const shouldMountVideo =
    isVideo && shouldPlayVideo && !prefersReducedMotion && !isMobile && isDesktopRevealed && videoDeferredReady;

  useEffect(() => {
    if (!isVideo) return;
    if (typeof navigator === 'undefined') return;

    const conn = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
          effectiveType?: string;
          addEventListener?: (type: 'change', listener: () => void) => void;
          removeEventListener?: (type: 'change', listener: () => void) => void;
        };
      }
    ).connection;

    // Initial decide() di useState init sudah handle first render.
    // Effect ini hanya untuk subscribe perubahan connection runtime
    // (mis. wifi → cellular), bukan first evaluation.
    const decide = () => {
      if (!conn) {
        setShouldPlayVideo(true);
        return;
      }
      const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
      setShouldPlayVideo(!conn.saveData && !slow);
    };

    conn?.addEventListener?.('change', decide);
    return () => {
      conn?.removeEventListener?.('change', decide);
    };
  }, [isVideo]);

  const videoRefA = React.useRef<HTMLVideoElement>(null);
  const videoRefB = React.useRef<HTMLVideoElement>(null);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const isTransitioningRef = React.useRef(false);

  // Compute base start time
  const startTime = useMemo(() => {
    const match = videoSrc.match(/#t=(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : (activeEntry?.startTime ?? 14);
  }, [videoSrc, activeEntry?.startTime]);

  // Timeupdate handler for Video A (triggers crossfade to Video B near end)
  const handleTimeUpdateA = useCallback(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB || isTransitioningRef.current || activePlayer !== 'A') return;

    const remaining = vA.duration - vA.currentTime;
    const threshold = Math.min(1.0, vA.duration * 0.15 || 1.0);

    if (remaining <= threshold && remaining > 0 && vA.duration > 0) {
      isTransitioningRef.current = true;
      vB.currentTime = startTime;
      vB.play().catch(() => {});
      setActivePlayer('B');

      setTimeout(() => {
        isTransitioningRef.current = false;
        if (vA && !vA.paused) {
          vA.pause();
        }
      }, 1000);
    }
  }, [activePlayer, startTime]);

  // Timeupdate handler for Video B (triggers crossfade to Video A near end)
  const handleTimeUpdateB = useCallback(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB || isTransitioningRef.current || activePlayer !== 'B') return;

    const remaining = vB.duration - vB.currentTime;
    const threshold = Math.min(1.0, vB.duration * 0.15 || 1.0);

    if (remaining <= threshold && remaining > 0 && vB.duration > 0) {
      isTransitioningRef.current = true;
      vA.currentTime = startTime;
      vA.play().catch(() => {});
      setActivePlayer('A');

      setTimeout(() => {
        isTransitioningRef.current = false;
        if (vB && !vB.paused) {
          vB.pause();
        }
      }, 1000);
    }
  }, [activePlayer, startTime]);

  // Programmatic playback control linked to desktop boot/reveal state
  useEffect(() => {
    if (!shouldMountVideo) return;
    const vA = videoRefA.current;
    const vB = videoRefB.current;

    if (vA) {
      vA.currentTime = startTime;
      vA.play().catch((err) => {
        console.warn('[DesktopBackground] Video A playback aborted:', err);
      });
    }
    if (vB) {
      vB.currentTime = startTime;
    }
    isTransitioningRef.current = false;
  }, [shouldMountVideo, videoSrc, startTime]);

  // iOS-style background effect: scales down slightly and blurs when a window is active.
  // Reduced-motion or mobile: skip spring entirely — langsung set filter static tanpa scale shift.
  const springTransition: Transition =
    prefersReducedMotion || isMobile
      ? { duration: 0 }
      : { type: 'spring', stiffness: 180, damping: 28, mass: 1 };

  // Video wallpaper: skip scale 1.08 supaya tidak zoom/upsample (yang bikin
  // pecah). Image wallpaper tetap dapat efek breathing iOS karena image
  // di-resize sharp di build pipeline + Next/Image, jadi aman di-scale.
  const idleScale = isVideo ? 1 : 1.08;
  const mobileBlur = Math.max(blurAmount + 16, 16);

  const animateTarget = isMobile
    ? {
        scale: 1.06,
        filter: `blur(${mobileBlur}px)`,
      }
    : prefersReducedMotion
      ? {
          scale: 1,
          filter: `blur(${blurAmount}px)`,
        }
      : {
          scale: isWindowOpen ? 1 : idleScale,
          // Window-open blur amplification dikurangi dari +12 ke +6.
          // Alasan: nilai +12 membuat wallpaper terlalu pucat untuk di-pickup
          // oleh backdrop-filter dock (chained blur kehilangan info warna →
          // dock terasa "padat putih" alih-alih "vibrancy glass"). +6 cukup
          // untuk efek iOS-depth tanpa membunuh dock.
          filter: isWindowOpen ? `blur(${blurAmount + 6}px)` : `blur(${blurAmount}px)`,
        };

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black">
      <m.div
        className="relative h-full w-full"
        initial={false}
        animate={animateTarget}
        transition={springTransition}
      >
        {/*
          Primary poster / wallpaper image — rendered continuously with priority to establish
          and maintain a stable LCP element without DOM node replacement thrashing.
        */}
        {(() => {
          const wallpaperImageSrc = isVideo ? (posterUrl || DEFAULT_WALLPAPER_URL) : activeWallpaper;
          return (
            <Image
              key={wallpaperImageSrc}
              src={wallpaperImageSrc}
              alt="Desktop wallpaper"
              fill
              priority
              fetchPriority="high"
              quality={75}
              sizes="100vw"
              className={`object-cover transition-opacity duration-700 ${
                isVideo && videoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ transform: 'translateZ(0)' }}
            />
          );
        })()}

        {/* Dual-Video Seamless Crossfade Stream Layer */}
        {isVideo && shouldMountVideo && (
          <>
            {/* Player A */}
            <video
              ref={videoRefA}
              src={videoSrc}
              poster={posterUrl}
              muted
              playsInline
              preload="auto"
              onCanPlay={handleVideoCanPlay}
              onTimeUpdate={handleTimeUpdateA}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                videoReady && activePlayer === 'A' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: 'translateZ(0)' }}
            />

            {/* Player B (Buffer & Crossfade Twin) */}
            <video
              ref={videoRefB}
              src={videoSrc}
              poster={posterUrl}
              muted
              playsInline
              preload="auto"
              onTimeUpdate={handleTimeUpdateB}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                videoReady && activePlayer === 'B' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: 'translateZ(0)' }}
            />
          </>
        )}
      </m.div>

      {/* Dark overlay - kept subtle or disabled as per request */}
      <m.div
        className="pointer-events-none absolute inset-0 bg-black/5"
        animate={{ opacity: prefersReducedMotion ? 1 : isWindowOpen ? 0 : 1 }}
        transition={springTransition}
        aria-hidden="true"
      />
    </div>
  );
}
