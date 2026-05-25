import React from 'react';
import Image from 'next/image';
import { DEFAULT_WALLPAPER_URL, Z_LAYERS } from '../utils/zIndexLayers';

interface DesktopSkeletonProps {
  wallpaperUrl?: string;
  isBooting?: boolean;
}

export default function DesktopSkeleton({ wallpaperUrl, isBooting }: DesktopSkeletonProps) {
  const isValidUrl =
    wallpaperUrl && (wallpaperUrl.startsWith('/') || wallpaperUrl.startsWith('http'));
  const wallpaper = isValidUrl ? wallpaperUrl : DEFAULT_WALLPAPER_URL;

  const isVideo =
    wallpaper.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || wallpaper.startsWith('data:video');

  // If booting, show absolutely nothing but black to prevent "Skeleton Glitch"
  if (isBooting) {
    return <div className="fixed inset-0 bg-black" style={{ zIndex: Z_LAYERS.BOOT }} />;
  }

  return (
    <div className="fixed inset-0 h-full w-full select-none overflow-hidden bg-[#050505]">
      {/* Real Wallpaper LCP Skeleton - Instantly visible on SSG Load */}
      {/* Image: scale 1.08 untuk efek breathing iOS. Video: tanpa scale
                supaya tidak ke-upsample (yang bikin pecah) — fill 100% via
                object-cover, konsisten dengan DesktopBackground. */}
      <div className={`absolute inset-0 z-0 ${isVideo ? '' : 'scale-[1.08]'}`}>
        {isVideo ? (
          <video
            src={wallpaper}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={wallpaper}
            alt="Desktop Wallpaper"
            fill
            priority
            fetchPriority="high"
            loading="eager"
            quality={75}
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* Dark overlay matching DesktopBackground */}
      <div className="desktop-skeleton-overlay z-1 pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  );
}
