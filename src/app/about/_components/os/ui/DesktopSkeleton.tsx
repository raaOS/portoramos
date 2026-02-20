import React from 'react';

export default function DesktopSkeleton() {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden select-none bg-[#050505]">
            {/* Wallpaper Blur Background Skeleton */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2c] via-[#4a192c] to-[#121212] opacity-50" />

            {/* Fake Menu Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-white/10 backdrop-blur-xl z-50 flex items-center px-4 border-b border-white/10">
                <div className="w-16 h-3 bg-white/20 rounded" />
            </div>

            {/* Skeleton Grid (Desktop Icons) */}
            <div className="absolute inset-0 pt-12 pb-24 px-6 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl animate-pulse shadow-2xl" />
                        <div className="w-14 h-2 bg-white/20 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Fake Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-20 w-[450px] bg-white/10 backdrop-blur-3xl rounded-[24px] border border-white/20 shadow-2xl" />
        </div>
    );
}
