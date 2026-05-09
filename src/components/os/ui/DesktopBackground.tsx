import { useMemo } from 'react';
import Image from 'next/image';
import { m } from 'motion/react';
import type { WallpaperConfig } from '@/types/about';

interface DesktopBackgroundProps {
    wallpaperConfig?: WallpaperConfig;
    isWindowOpen?: boolean;
}

/**
 * Optimized Desktop Background for LCP
 * Uses priority loading for active wallpaper
 */
export default function DesktopBackground({ wallpaperConfig, isWindowOpen = false }: DesktopBackgroundProps) {
    const activeWallpaper = useMemo(() => {
        if (!wallpaperConfig?.activeWallpaperId) {
            return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
        }
        const resolved = wallpaperConfig.collection?.find(
            (w) => w.id === wallpaperConfig.activeWallpaperId
        )?.url;

        const isValidUrl = resolved && (resolved.startsWith('/') || resolved.startsWith('http'));
        return isValidUrl ? resolved : "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    }, [wallpaperConfig]);

    const blurAmount = wallpaperConfig?.blur || 0;
    const isVideo = useMemo(() => {
        return activeWallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || activeWallpaper.startsWith('data:video');
    }, [activeWallpaper]);

    // iOS-style background effect: scales down slightly and blurs when a window is active
    const springTransition = { type: "spring", stiffness: 180, damping: 28, mass: 1 };

    return (
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden bg-black">
            <m.div 
                className="relative w-full h-full"
                initial={false}
                animate={{ 
                    scale: isWindowOpen ? 1 : 1.08,
                    filter: isWindowOpen ? `blur(${blurAmount + 12}px)` : `blur(${blurAmount}px)`,
                }}
                transition={springTransition}
            >
                {/* Primary wallpaper - Priority load for LCP */}
                {isVideo ? (
                    <video
                        src={activeWallpaper}
                        autoPlay
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
                animate={{ opacity: isWindowOpen ? 0 : 1 }}
                transition={springTransition}
                aria-hidden="true"
            />
        </div>
    );
}
