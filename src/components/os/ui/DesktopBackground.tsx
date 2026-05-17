import { useMemo } from 'react';
import Image from 'next/image';
import { m, useReducedMotion, type Transition } from 'motion/react';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../utils/zIndexLayers';

interface DesktopBackgroundProps {
    wallpaperConfig?: WallpaperConfig;
    isWindowOpen?: boolean;
}

/**
 * Optimized Desktop Background for LCP
 * Uses priority loading for active wallpaper
 */
export default function DesktopBackground({ wallpaperConfig, isWindowOpen = false }: DesktopBackgroundProps) {
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
        return activeWallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || activeWallpaper.startsWith('data:video');
    }, [activeWallpaper]);

    // iOS-style background effect: scales down slightly and blurs when a window is active.
    // Reduced-motion: skip spring entirely — langsung set filter static tanpa scale shift.
    const springTransition: Transition = prefersReducedMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 180, damping: 28, mass: 1 };

    const animateTarget = prefersReducedMotion
        ? {
              scale: 1,
              filter: `blur(${blurAmount}px)`,
          }
        : {
              scale: isWindowOpen ? 1 : 1.08,
              filter: isWindowOpen ? `blur(${blurAmount + 12}px)` : `blur(${blurAmount}px)`,
          };

    return (
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden bg-black">
            <m.div 
                className="relative w-full h-full"
                initial={false}
                animate={animateTarget}
                transition={springTransition}
            >
                {/* Primary wallpaper - Priority load for LCP */}
                {isVideo ? (
                    <video
                        src={activeWallpaper}
                        autoPlay={!prefersReducedMotion}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: 'translateZ(0)' }}
                    />
                ) : (
                    <Image
                        src={activeWallpaper}
                        alt="Desktop wallpaper"
                        fill
                        priority
                        fetchPriority="high"
                        quality={90}
                        sizes="100vw"
                        className="object-cover"
                        style={{ transform: 'translateZ(0)' }}
                    />
                )}
            </m.div>
            
            {/* Dark overlay - kept subtle or disabled as per request */}
            <m.div 
                className="absolute inset-0 bg-black/5 pointer-events-none" 
                animate={{ opacity: prefersReducedMotion ? 1 : (isWindowOpen ? 0 : 1) }}
                transition={springTransition}
                aria-hidden="true"
            />
        </div>
    );
}
