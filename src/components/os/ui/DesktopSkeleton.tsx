import React from 'react';
import Image from 'next/image';

interface DesktopSkeletonProps {
    wallpaperUrl?: string;
    isBooting?: boolean;
}

export default function DesktopSkeleton({ wallpaperUrl, isBooting }: DesktopSkeletonProps) {
    const defaultWallpaper = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    const isValidUrl = wallpaperUrl && (wallpaperUrl.startsWith('/') || wallpaperUrl.startsWith('http'));
    const wallpaper = isValidUrl ? wallpaperUrl : defaultWallpaper;

    const isVideo = wallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || wallpaper.startsWith('data:video');

    // If booting, show absolutely nothing but black to prevent "Skeleton Glitch"
    if (isBooting) {
        return <div className="fixed inset-0 bg-black z-[999999]" />;
    }

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-[#050505]">
            {/* Real Wallpaper LCP Skeleton - Instantly visible on SSG Load */}
            <div className="absolute inset-0 z-0">
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
            <div className="absolute inset-0 bg-black/20 z-1 pointer-events-none" />

            {/* Fake Menu Bar 
                - Matched to MenuBar.tsx exactly
            */}
            <div className="absolute top-0 left-0 right-0 h-9 sm:h-8 bg-white flex items-center px-4 z-[10000] border-b border-gray-200">
                <div className="w-16 h-3 bg-gray-200/50 rounded" />
            </div>

            {/* Fake Dock 
                - Matched to UIOverlaysLayer.tsx and Dock.tsx
            */}
            <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-[99999] pb-safe">
                <div className="h-[96px] sm:h-[72px] w-[90%] max-w-[450px] bg-white/95 rounded-[24px] border border-gray-200/20 shadow-[0_6px_6px_rgba(0,0,0,0.2),0_0_20px_rgba(0,0,0,0.1)]" />
            </div>

        </div>
    );
}
