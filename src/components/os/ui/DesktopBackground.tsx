import { useMemo } from 'react';
import Image from 'next/image';
import { m, useReducedMotion, type Transition } from 'motion/react';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../utils/zIndexLayers';

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

  const activeWallpaper = useMemo(() => {
    if (!wallpaperConfig?.activeWallpaperId) {
      return DEFAULT_WALLPAPER_URL;
    }
    const resolved = wallpaperConfig.collection?.find(
      (w) => w.id === wallpaperConfig.activeWallpaperId
    )?.url;

    const isValidUrl = resolved && (resolved.startsWith('/') || resolved.startsWith('http'));
    return isValidUrl ? resolved : DEFAULT_WALLPAPER_URL;
  }, [wallpaperConfig]);

  const blurAmount = wallpaperConfig?.blur || 0;
  const isVideo = useMemo(() => {
    return (
      activeWallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ||
      activeWallpaper.startsWith('data:video')
    );
  }, [activeWallpaper]);

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
          // Fill 100% via object-cover, TANPA scale 1.08 supaya
          // video tidak ke-upsample (yang bikin pecah). Resolusi
          // video sebaiknya >= 1920x1080 untuk display modern;
          // validasi resolusi minimum di-enforce saat upload via
          // admin (lihat WallpaperManager).
          <video
            src={activeWallpaper}
            autoPlay={!prefersReducedMotion}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            style={{ transform: 'translateZ(0)' }}
          />
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
