'use client';

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { DesktopWindowContext } from '@/components/os/context/DesktopWindowContext';
import type { GalleryItem } from '@/types/projects';

interface UseLightboxGesturesProps {
  validItems: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  windowId?: string;
}

export function useLightboxGestures({
  validItems,
  initialIndex,
  onClose,
  windowId,
}: UseLightboxGesturesProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const desktopContext = useContext(DesktopWindowContext);

  const isWindowMaximized =
    desktopContext && windowId
      ? desktopContext.windows.find((w) => w.id === windowId)?.isMaximized || false
      : false;

  const showActiveFullscreenState = windowId && desktopContext ? isWindowMaximized : isFullscreen;

  const toggleFullscreen = useCallback(() => {
    if (windowId && desktopContext) {
      desktopContext.maximizeWindow(windowId);
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, [windowId, desktopContext]);

  useEffect(() => {
    if (windowId && desktopContext) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [windowId, desktopContext]);

  useEffect(() => {
    return () => {
      if (windowId && desktopContext) return;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [windowId, desktopContext]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === validItems.length - 1 ? 0 : prev + 1));
  }, [validItems.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validItems.length - 1 : prev - 1));
  }, [validItems.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    },
    [onClose, handleNext, handlePrev]
  );

  useEffect(() => {
    if (!windowId || !desktopContext) {
      document.body.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown, windowId, desktopContext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(diff) >= SWIPE_THRESHOLD) {
        if (diff > 0) handlePrev();
        else handleNext();
      }
      touchStartX.current = null;
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    showActiveFullscreenState,
    desktopContext,
    toggleFullscreen,
    handleNext,
    handlePrev,
    handleTouchStart,
    handleTouchEnd,
  };
}
