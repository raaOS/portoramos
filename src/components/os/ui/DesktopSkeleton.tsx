import React from 'react';
import { Z_LAYERS } from '../utils/zIndexLayers';

interface DesktopSkeletonProps {
  isBooting?: boolean;
  fading?: boolean;
}

/**
 * Skeleton overlay shown sebelum DesktopOS chunk siap dan saat
 * `useDesktopLock` masih mounted=false.
 *
 * Catatan kunci (post-2026-06): skeleton ini SENGAJA tidak render
 * wallpaper-nya sendiri. Wallpaper (`DesktopBackground`) sekarang hidup
 * di level `HomeOSWrapper`, jadi SSR -> hydration -> chunk swap ->
 * mounted flip semua tetap pakai DOM `<video>` yang sama. Tujuannya
 * mencegah video element ke-remount tiga kali (dulu setiap remount =
 * fetch ulang dari awal -> visitor lihat poster JPG / layar hitam
 * selama beberapa detik sebelum video pertama play).
 *
 * Yang masih jadi tanggung jawab skeleton:
 *   - Black-on-boot mode untuk fase StartScreen ("click to start").
 *   - Subtle dim overlay supaya icons stagger animation di
 *     DesktopMain tidak terasa pop-in dari wallpaper kosong.
 */
export default function DesktopSkeleton({ isBooting, fading }: DesktopSkeletonProps) {
  if (isBooting) {
    return <div className="fixed inset-0 bg-black" style={{ zIndex: Z_LAYERS.BOOT }} />;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 select-none transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      // Sit ABOVE DesktopBackground (z-0) tapi di bawah konten desktop.
      // Subtle dim untuk cover gap pre-icons-mount tanpa menutupi
      // wallpaper sepenuhnya.
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-black/20" />
      {/* macOS-style loading indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
          <div className="animate-indeterminate-bar h-full w-1/3 rounded-full bg-white/50" />
        </div>
      </div>
    </div>
  );
}
