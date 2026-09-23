'use client';

import { useState, useEffect, useRef } from 'react';

interface UseDesktopIconHoverOptions {
  isMobile?: boolean;
  videoUrl?: string;
}

export function useDesktopIconHover({ isMobile = false, videoUrl }: UseDesktopIconHoverOptions) {
  const [hovering, setHovering] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      if (hovering && previewActive && !isMobile) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [hovering, previewActive, isMobile, videoUrl]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  const clearPreviewTimer = () => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setHovering(true);
    clearPreviewTimer();
    previewTimerRef.current = window.setTimeout(() => {
      setPreviewActive(true);
      previewTimerRef.current = null;
    }, 160);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    clearPreviewTimer();
    setPreviewActive(false);
    setHovering(false);
  };

  return {
    hovering,
    previewActive,
    videoRef,
    handleMouseEnter,
    handleMouseLeave,
  };
}
