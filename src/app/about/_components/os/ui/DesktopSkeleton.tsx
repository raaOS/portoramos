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

            {/* Fake Menu Bar 
                - Dipertahankan sangat samar hanya untuk memberikan sense of depth jika koneksi internet super lambat 
            */}
            <div className="absolute top-0 left-0 right-0 h-9 sm:h-8 bg-white/50 backdrop-blur-sm flex items-center px-4 z-[10000]">
                <div className="w-16 h-3 bg-gray-200/50 rounded" />
            </div>

            {/* Skeleton Grid (Desktop Icons) Dihapus
                Alasan: Memastikan "Blank Canvas" penuh untuk animasi Staggered Materialize dari Framer Motion
            */}

            {/* Fake Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-20 w-[90%] max-w-[450px] bg-white/30 backdrop-blur-md rounded-[24px] border border-gray-200/20" />

        </div>
    );
}
