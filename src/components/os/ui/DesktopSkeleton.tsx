import React from 'react';
import { Z_LAYERS } from '../utils/zIndexLayers';

interface DesktopSkeletonProps {
  isBooting?: boolean;
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
export default function DesktopSkeleton({ isBooting }: DesktopSkeletonProps) {
  if (isBooting) {
    return <div className="fixed inset-0 bg-black" style={{ zIndex: Z_LAYERS.BOOT }} />;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 select-none"
      // Sit ABOVE DesktopBackground (z-0) tapi di bawah konten desktop.
      // Subtle dim untuk cover gap pre-icons-mount tanpa menutupi
      // wallpaper sepenuhnya.
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
