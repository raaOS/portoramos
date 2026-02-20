"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { WallpaperConfig } from "@/types/about";

interface DesktopBackgroundProps {
    wallpaperConfig?: WallpaperConfig | null;
}

export default function DesktopBackground({ wallpaperConfig }: DesktopBackgroundProps) {
    // Wallpaper
    const [wallpaper] = useState(() => {
        if (wallpaperConfig?.activeWallpaperId && wallpaperConfig?.collection) {
            const active = wallpaperConfig.collection.find((w: any) => w.id === wallpaperConfig?.activeWallpaperId);
            if (active) return active.url;
        }
        return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop";
    });

    return (
        <div className="absolute inset-0 z-0">
            <Image
                src={wallpaper}
                alt="Desktop Wallpaper"
                fill
                priority
                loading="eager"
                quality={90} // High quality for LCP, balanced with size
                sizes="100vw"
                className="object-cover transition-all duration-700"
                style={{ filter: `blur(${wallpaperConfig?.blur || 0}px)` }}
            />
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] backface-invisible will-change-transform" />
        </div>
    );
}
