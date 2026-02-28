"use client";

import { useMemo } from 'react';
import Image from 'next/image';
import type { WallpaperConfig } from '@/types/about';

interface DesktopBackgroundProps {
    wallpaperConfig?: WallpaperConfig;
}

/**
 * Optimized Desktop Background for LCP
 * Uses priority loading for active wallpaper
 */
export default function DesktopBackground({ wallpaperConfig }: DesktopBackgroundProps) {
    const activeWallpaper = useMemo(() => {
        if (!wallpaperConfig?.activeWallpaperId) {
            return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
        }
        return wallpaperConfig.collection?.find(
            (w) => w.id === wallpaperConfig.activeWallpaperId
        )?.url || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    }, [wallpaperConfig]);

    const blurAmount = wallpaperConfig?.blur || 0;

    return (
        <div 
            className="absolute inset-0 z-0"
            style={{
                width: '100%',
                height: '100%',
            }}
        >
            {/* Primary wallpaper - Priority load for LCP */}
            <Image
                src={activeWallpaper}
                alt="Desktop wallpaper"
                fill
                priority
                fetchPriority="high"
                quality={90}
                sizes="100vw"
                className="object-cover"
                style={{
                    filter: blurAmount > 0 ? `blur(${blurAmount}px)` : undefined,
                    transform: 'translateZ(0)', // GPU acceleration
                }}
            />
            
            {/* Dark overlay for better contrast */}
            <div 
                className="absolute inset-0 bg-black/20 pointer-events-none" 
                aria-hidden="true"
            />
        </div>
    );
}
