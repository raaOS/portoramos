'use client';

import { useState, useEffect } from 'react';

interface UseNetworkAwareVideoOptions {
  isVideo: boolean;
  isMobile?: boolean;
  prefersReducedMotion: boolean | null;
  isDesktopRevealed: boolean;
}

export function useNetworkAwareVideo({
  isVideo,
  isMobile = false,
  prefersReducedMotion,
  isDesktopRevealed,
}: UseNetworkAwareVideoOptions) {
  const [shouldPlayVideo, setShouldPlayVideo] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    // Ultra-low-end device guard (<= 2 logical cores): preserve CPU/GPU by using poster image
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) {
      return false;
    }
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (!conn) return true;
    const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
    return !conn.saveData && !slow;
  });

  const [videoDeferredReady, setVideoDeferredReady] = useState(false);

  useEffect(() => {
    if (!isVideo || isMobile || prefersReducedMotion || !isDesktopRevealed) return;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => setVideoDeferredReady(true), {
        timeout: 1200,
      });
      return () => window.cancelIdleCallback(idleId);
    } else {
      const tid = setTimeout(() => setVideoDeferredReady(true), 800);
      return () => clearTimeout(tid);
    }
  }, [isVideo, isMobile, prefersReducedMotion, isDesktopRevealed]);

  useEffect(() => {
    if (!isVideo) return;
    if (typeof navigator === 'undefined') return;

    const isLowPowerHardware =
      typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;

    const conn = (
      navigator as Navigator & {
        connection?: {
          saveData?: boolean;
          effectiveType?: string;
          addEventListener?: (type: 'change', listener: () => void) => void;
          removeEventListener?: (type: 'change', listener: () => void) => void;
        };
      }
    ).connection;

    const decide = () => {
      if (isLowPowerHardware) {
        setShouldPlayVideo(false);
        return;
      }
      if (!conn) {
        setShouldPlayVideo(true);
        return;
      }
      const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
      setShouldPlayVideo(!conn.saveData && !slow);
    };

    conn?.addEventListener?.('change', decide);
    return () => {
      conn?.removeEventListener?.('change', decide);
    };
  }, [isVideo]);

  const shouldMountVideo =
    isVideo &&
    shouldPlayVideo &&
    !prefersReducedMotion &&
    !isMobile &&
    isDesktopRevealed &&
    videoDeferredReady;

  return {
    shouldMountVideo,
  };
}
