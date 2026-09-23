'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../utils/zIndexLayers';
import { useBackgroundEffect } from '@/components/home/BackgroundEffectContext';
import { useWallpaperSource } from './desktop-background/useWallpaperSource';
import { useNetworkAwareVideo } from './desktop-background/useNetworkAwareVideo';
import { DualVideoSeamlessPlayer } from './desktop-background/DualVideoSeamlessPlayer';

interface DesktopBackgroundProps {
  wallpaperConfig?: WallpaperConfig;
  isWindowOpen?: boolean;
  isMobile?: boolean;
}

export default function DesktopBackground({
  wallpaperConfig,
  isWindowOpen = false,
  isMobile = false,
}: DesktopBackgroundProps) {
  const { isDesktopRevealed } = useBackgroundEffect();

  const { activeWallpaper, isVideo, videoSrc, posterUrl, startTime } =
    useWallpaperSource(wallpaperConfig);

  const blurAmount = wallpaperConfig?.blur || 0;
  const [videoReady, setVideoReady] = useState(false);
  const [prevVideoSrc, setPrevVideoSrc] = useState(videoSrc);

  if (videoSrc !== prevVideoSrc) {
    setPrevVideoSrc(videoSrc);
    setVideoReady(false);
  }

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { shouldMountVideo } = useNetworkAwareVideo({
    isVideo,
    isMobile,
    prefersReducedMotion,
    isDesktopRevealed,
  });

  const idleScale = isVideo ? 1 : 1.08;
  const mobileBlur = Math.max(blurAmount + 16, 16);

  const targetFilter = isMobile
    ? `blur(${mobileBlur}px)`
    : prefersReducedMotion || (!isWindowOpen && blurAmount === 0)
      ? 'none'
      : isWindowOpen
        ? `blur(${blurAmount + 6}px)`
        : blurAmount > 0
          ? `blur(${blurAmount}px)`
          : 'none';

  const scaleValue = isMobile
    ? 1.06
    : prefersReducedMotion
      ? 1
      : isWindowOpen
        ? 1
        : idleScale;

  const transitionDuration = prefersReducedMotion || isMobile ? '0s' : '0.6s';

  const wallpaperImageSrc = isVideo ? posterUrl || DEFAULT_WALLPAPER_URL : activeWallpaper;

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black">
      <div
        className="relative h-full w-full"
        style={{
          transform: `translateZ(0) scale(${scaleValue})`,
          filter: targetFilter,
          transition: `transform ${transitionDuration} cubic-bezier(0.34, 1.56, 0.64, 1), filter ${transitionDuration} ease`,
          willChange: 'transform, filter',
        }}
      >
        <Image
          src={wallpaperImageSrc}
          alt="Desktop wallpaper"
          fill
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
          className={`object-cover ${
            isVideo && videoReady ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{ transform: 'translateZ(0)' }}
        />

        {isVideo && (
          <DualVideoSeamlessPlayer
            videoSrc={videoSrc}
            posterUrl={posterUrl}
            startTime={startTime}
            videoReady={videoReady}
            onVideoCanPlay={handleVideoCanPlay}
            shouldMountVideo={shouldMountVideo}
          />
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-black/5"
        style={{
          opacity: prefersReducedMotion ? 1 : isWindowOpen ? 0 : 1,
          transition: `opacity ${transitionDuration} ease`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}