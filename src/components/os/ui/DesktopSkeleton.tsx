import React from 'react';
import Image from 'next/image';
import { DEFAULT_WALLPAPER_URL, Z_LAYERS } from '../utils/zIndexLayers';

interface DesktopSkeletonProps {
    wallpaperUrl?: string;
    isBooting?: boolean;
}

export default function DesktopSkeleton({ wallpaperUrl, isBooting }: DesktopSkeletonProps) {
    const isValidUrl = wallpaperUrl && (wallpaperUrl.startsWith('/') || wallpaperUrl.startsWith('http'));
    const wallpaper = isValidUrl ? wallpaperUrl : DEFAULT_WALLPAPER_URL;

    const isVideo = wallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || wallpaper.startsWith('data:video');

    // If booting, show absolutely nothing but black to prevent "Skeleton Glitch"
    if (isBooting) {
        return <div className="fixed inset-0 bg-black" style={{ zIndex: Z_LAYERS.BOOT }} />;
    }

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-[#050505]">
            {/* Real Wallpaper LCP Skeleton - Instantly visible on SSG Load */}
            <div className="absolute inset-0 z-0 scale-[1.08]">
                {isVideo ? (
                    <video
                        src={wallpaper}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Image
                        src={wallpaper}
                        alt="Desktop Wallpaper"
                        fill
                        priority
                        fetchPriority="high"
                        loading="eager"
                        quality={90}
                        sizes="100vw"
                        className="object-cover"
                    />
                )}
            </div>

            {/* Dark overlay matching DesktopBackground */}
            <div className="desktop-skeleton-overlay absolute inset-0 bg-black/20 z-1 pointer-events-none" />
        </div>
    );
}
