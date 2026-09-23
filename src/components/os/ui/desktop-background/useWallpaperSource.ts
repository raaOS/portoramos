'use client';

import { useMemo, useState, useEffect } from 'react';
import type { WallpaperConfig } from '@/types/about';
import { DEFAULT_WALLPAPER_URL } from '../../utils/zIndexLayers';
import { getVideoPosterCandidates, isVideoSource } from '@/lib/mediaPreview';

export function useWallpaperSource(wallpaperConfig?: WallpaperConfig) {
  const activeEntry = useMemo(() => {
    if (!wallpaperConfig?.activeWallpaperId) return null;
    return (
      wallpaperConfig.collection?.find((w) => w.id === wallpaperConfig.activeWallpaperId) ?? null
    );
  }, [wallpaperConfig]);

  const activeWallpaper = useMemo(() => {
    const resolved = activeEntry?.url;
    const isValidUrl = resolved && (resolved.startsWith('/') || resolved.startsWith('http'));
    return isValidUrl ? resolved : DEFAULT_WALLPAPER_URL;
  }, [activeEntry]);

  const isVideo = useMemo(() => isVideoSource(activeWallpaper), [activeWallpaper]);

  const videoSrc = useMemo(() => {
    if (!isVideo) return activeWallpaper;
    if (activeEntry?.startTime !== undefined) {
      const baseUrl = activeWallpaper.split('#')[0];
      return `${baseUrl}#t=${activeEntry.startTime}`;
    }
    return activeWallpaper;
  }, [activeWallpaper, isVideo, activeEntry]);

  const posterCandidates = useMemo(() => {
    if (!isVideo) return [] as string[];
    if (activeEntry?.posterUrl) return [activeEntry.posterUrl];
    return getVideoPosterCandidates(activeWallpaper);
  }, [isVideo, activeEntry, activeWallpaper]);

  const seedPoster = posterCandidates[0];

  const [probedOverride, setProbedOverride] = useState<{ url: string; forSeed: string } | null>(
    null
  );

  const posterUrl =
    probedOverride && probedOverride.forSeed === seedPoster ? probedOverride.url : seedPoster;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (posterCandidates.length <= 1) return;

    const seed = posterCandidates[0];
    let cancelled = false;
    let activeImg: HTMLImageElement | null = null;

    const tryNext = (index: number) => {
      if (cancelled) return;
      if (index >= posterCandidates.length) return;
      const url = posterCandidates[index];
      const img = new window.Image();
      activeImg = img;
      img.onload = () => {
        if (cancelled) return;
        if (url !== seed) {
          setProbedOverride({ url, forSeed: seed });
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        tryNext(index + 1);
      };
      img.src = url;
    };

    tryNext(1);

    return () => {
      cancelled = true;
      if (activeImg) {
        activeImg.onload = null;
        activeImg.onerror = null;
        activeImg.src = '';
      }
    };
  }, [posterCandidates]);

  const startTime = useMemo(() => {
    const match = videoSrc.match(/#t=(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : (activeEntry?.startTime ?? 0);
  }, [videoSrc, activeEntry?.startTime]);

  return {
    activeWallpaper,
    isVideo,
    videoSrc,
    posterUrl,
    startTime,
  };
}
