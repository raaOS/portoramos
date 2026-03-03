import React from 'react';
import Image from 'next/image';

interface DesktopSkeletonProps {
    wallpaperUrl?: string;
    isBooting?: boolean;
}

export default function DesktopSkeleton({ wallpaperUrl, isBooting }: DesktopSkeletonProps) {
    const defaultWallpaper = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    const wallpaper = wallpaperUrl || defaultWallpaper;

    // If booting, show absolutely nothing but black to prevent "Skeleton Glitch"
    if (isBooting) {
        return <div className="fixed inset-0 bg-black z-[10001]" />;
    }

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-white">
            {/* Real Wallpaper LCP Skeleton - Crucial for Speed Insights 99+ */}
            <div className="absolute inset-0 z-0 opacity-0">
                <Image
                    src={wallpaper}
                    alt="Desktop Wallpaper"
                    fill
                    priority
                    loading="eager"
                    quality={60}
                    sizes="100vw"
                    className="object-cover"
                />
            </div>

            {/* Dark overlay during loading */}
            <div className="absolute inset-0 bg-black z-1" />

            {/* Fake Menu Bar */}
            <div className="absolute top-0 left-0 right-0 h-9 sm:h-8 bg-white/80 backdrop-blur-md flex items-center px-4 border-b border-gray-100 z-[10000]">
                <div className="w-16 h-3 bg-gray-200 rounded" />
                <div className="ml-auto flex gap-3">
                    <div className="w-8 h-3 bg-gray-200 rounded" />
                    <div className="w-12 h-3 bg-gray-200 rounded" />
                </div>
            </div>

            {/* Skeleton Grid (Desktop Icons) */}
            <div className="absolute inset-0 pt-12 pb-24 px-6 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl animate-pulse shadow-sm" />
                        <div className="w-14 h-2 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Fake Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-20 w-[90%] max-w-[450px] bg-white/80 backdrop-blur-2xl rounded-[24px] border border-gray-200/50 shadow-lg" />
        </div>
    );
}
