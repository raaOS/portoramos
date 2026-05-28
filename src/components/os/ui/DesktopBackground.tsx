import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { m, useReducedMotion, type Transition } from 'motion/react';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../utils/zIndexLayers';
import { getVideoPosterSource, isVideoSource } from '@/lib/mediaPreview';

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

  // Resolve the active wallpaper entry (not just URL) so we can also
  // pick up the side-car poster image if the upload pipeline produced
  // one. Falls back to the JPG side-car convention (`<base>.jpg`) when
  // posterUrl wasn't persisted on older entries.
  const activeEntry = useMemo(() => {
    if (!wallpaperConfig?.activeWallpaperId) return null;
    return (
      wallpaperConfig.collection?.find(
        (w) => w.id === wallpaperConfig.activeWallpaperId
      ) ?? null
    );
  }, [wallpaperConfig]);

  const activeWallpaper = useMemo(() => {
    const resolved = activeEntry?.url;
    const isValidUrl = resolved && (resolved.startsWith('/') || resolved.startsWith('http'));
    return isValidUrl ? resolved : DEFAULT_WALLPAPER_URL;
  }, [activeEntry]);

  const blurAmount = wallpaperConfig?.blur || 0;
  const isVideo = useMemo(() => isVideoSource(activeWallpaper), [activeWallpaper]);

  const posterUrl = useMemo(() => {
    if (!isVideo) return undefined;
    return activeEntry?.posterUrl || getVideoPosterSource(activeWallpaper);
  }, [isVideo, activeEntry, activeWallpaper]);

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
  const [shouldPlayVideo, setShouldPlayVideo] = useState(true);

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

    const decide = () => {
      if (!conn) {
        setShouldPlayVideo(true);
        return;
      }
      const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
      setShouldPlayVideo(!conn.saveData && !slow);
    };

    decide();
    conn?.addEventListener?.('change', decide);
    return () => {
      conn?.removeEventListener?.('change', decide);
    };
  }, [isVideo]);

  // iOS-style background effect: scales down slightly and blurs when a window is active.
  // Reduced-motion or mobile: skip spring entirely — langsung set filter static tanpa scale shift.
  const springTransition: Transition = prefersReducedMotion || isMobile
    ? { duration: 0 }
    : { type: 'spring', stiffness: 180, damping: 28, mass: 1 };

  // Video wallpaper: skip scale 1.08 supaya tidak zoom/upsample (yang bikin
  // pecah). Image wallpaper tetap dapat efek breathing iOS karena image
  // di-resize sharp di build pipeline + Next/Image, jadi aman di-scale.
  const idleScale = isVideo ? 1 : 1.08;

  const animateTarget = prefersReducedMotion || isMobile
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
        {/* Primary wallpaper - Priority load for LCP */}
        {isVideo ? (
          // Bandwidth-aware video wallpaper.
          //
          //   - `poster` shows the side-car JPG instantly (one HTTP
          //     request, ~30-80 KB) so the screen is not black while
          //     the MP4 buffers. This is the LCP for the desktop on
          //     first paint when video is involved.
          //   - `preload="metadata"` tells the browser to fetch only
          //     the moov atom + a few KB of header so it can start
          //     playback, not the entire 1440p MP4 up front.
          //   - On `saveData` / 2g connections we don't render the
          //     <video> at all — we fall back to the poster as a still
          //     image. Visitor menghemat bandwidth, dan halaman tetap
          //     punya wallpaper visual yang masuk akal.
          shouldPlayVideo ? (
            <video
              src={activeWallpaper}
              poster={posterUrl}
              autoPlay={!prefersReducedMotion}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              style={{ transform: 'translateZ(0)' }}
            />
          ) : posterUrl ? (
            <Image
              src={posterUrl}
              alt="Desktop wallpaper"
              fill
              priority
              fetchPriority="high"
              quality={75}
              sizes="100vw"
              className="object-cover"
              style={{ transform: 'translateZ(0)' }}
            />
          ) : (
            <Image
              src={DEFAULT_WALLPAPER_URL}
              alt="Desktop wallpaper"
              fill
              priority
              fetchPriority="high"
              quality={75}
              sizes="100vw"
              className="object-cover"
              style={{ transform: 'translateZ(0)' }}
            />
          )
        ) : (
          <Image
            src={activeWallpaper}
            alt="Desktop wallpaper"
            fill
            priority
            fetchPriority="high"
            quality={75}
            sizes="100vw"
            className="object-cover"
            style={{ transform: 'translateZ(0)' }}
          />
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
