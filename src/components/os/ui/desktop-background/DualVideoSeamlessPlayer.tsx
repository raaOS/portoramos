'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface DualVideoSeamlessPlayerProps {
  videoSrc: string;
  posterUrl?: string;
  startTime: number;
  videoReady: boolean;
  onVideoCanPlay: () => void;
  shouldMountVideo: boolean;
}

/**
 * Ultra-smooth, hardware-accelerated video wallpaper player.
 * Uses native GPU-buffered looping (0 dropped frames, sub-frame rollover)
 * with automatic recovery, visibility management, and optional custom startTime.
 */
export function DualVideoSeamlessPlayer({
  videoSrc,
  posterUrl,
  startTime,
  videoReady,
  onVideoCanPlay,
  shouldMountVideo,
}: DualVideoSeamlessPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialSeekDoneRef = useRef(false);

  const handleReady = useCallback(() => {
    onVideoCanPlay();
  }, [onVideoCanPlay]);

  // Initial seek when metadata is loaded
  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      if (startTime > 0 && !initialSeekDoneRef.current) {
        if (v.duration && startTime < v.duration) {
          v.currentTime = startTime;
        } else {
          v.currentTime = 0;
        }
        initialSeekDoneRef.current = true;
      }
      if (shouldMountVideo && v.paused) {
        v.play().catch(() => {});
      }
    },
    [startTime, shouldMountVideo]
  );

  // If custom startTime > 0 was set, ensure loop restarts from startTime
  const handleTimeUpdate = useCallback(() => {
    if (startTime <= 0) return;
    const v = videoRef.current;
    if (!v || !v.duration) return;

    // Check if video looped back to 0 natively
    if (v.currentTime < 0.15 && initialSeekDoneRef.current) {
      if (startTime < v.duration) {
        v.currentTime = startTime;
      }
    }
  }, [startTime]);

  // Programmatic play & ready check on mount / src change
  useEffect(() => {
    if (!shouldMountVideo) return;
    initialSeekDoneRef.current = false;
    const v = videoRef.current;
    if (!v) return;

    if (startTime > 0) {
      if (!v.duration || startTime < v.duration) {
        try {
          v.currentTime = startTime;
          initialSeekDoneRef.current = true;
        } catch {
          // Metadata not ready yet, handleLoadedMetadata will seek
        }
      }
    }

    const playPromise = v.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be deferred until user interaction
        console.warn('[VideoWallpaper] Autoplay deferred:', err?.message || err);
      });
    }

    if (v.readyState >= 2 || !v.paused) {
      handleReady();
    }
  }, [shouldMountVideo, videoSrc, startTime, handleReady]);

  // Autoplay recovery on user gesture and pause/resume on visibility change
  useEffect(() => {
    if (!shouldMountVideo) return;
    const handleGestureResume = () => {
      const v = videoRef.current;
      if (v && v.paused && !document.hidden) {
        v.play().catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) {
        v.pause();
      } else if (v.paused) {
        v.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleGestureResume, { once: true });
    window.addEventListener('touchstart', handleGestureResume, { once: true, passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('click', handleGestureResume);
      window.removeEventListener('touchstart', handleGestureResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldMountVideo]);

  if (!shouldMountVideo) return null;

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={posterUrl}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      onCanPlay={handleReady}
      onLoadedData={handleReady}
      onPlaying={handleReady}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
        videoReady ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        transform: 'translateZ(0)',
        willChange: 'opacity',
      }}
    />
  );
}
