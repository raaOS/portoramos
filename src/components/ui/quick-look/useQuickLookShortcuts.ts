'use client';

import React, { useEffect, useState, useRef } from 'react';
import { QuickLookMediaType } from './types';

interface UseQuickLookShortcutsProps {
  type: QuickLookMediaType;
  onClose: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export function useQuickLookShortcuts({
  type,
  onClose,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: UseQuickLookShortcutsProps) {
  const [scale, setScale] = useState(1);
  const [showStatus, setShowStatus] = useState<'play' | 'pause' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (type === 'video') return;
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.75, scale + delta), 4);
    setScale(newScale);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setShowStatus('play');
      } else {
        videoRef.current.pause();
        setShowStatus('pause');
      }
      setTimeout(() => setShowStatus(null), 800);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.code === 'Space') {
        e.preventDefault();
        if (type === 'video') togglePlay();
        else onClose();
      }
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, type, hasNext, hasPrev, onNext, onPrev]);

  return {
    scale,
    setScale,
    showStatus,
    videoRef,
    containerRef,
    handleWheel,
    togglePlay,
  };
}
