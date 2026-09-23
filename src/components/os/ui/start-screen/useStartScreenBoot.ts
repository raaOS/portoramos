'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundManager } from '../../utils/SoundManager';

export type ScreenState = 'idle' | 'entering' | 'ready' | 'glassReveal' | 'done';

export const BOOT_CONFIG = {
  enterDelay: 500,
  enterDuration: 1500,
  revealDuration: 1500,
};

export const zoomOutTransition = {
  duration: BOOT_CONFIG.enterDuration / 1000,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const revealScaleTransition = {
  duration: BOOT_CONFIG.revealDuration / 1000,
  ease: [0.45, 0, 0.24, 1] as [number, number, number, number],
};

interface UseStartScreenBootOptions {
  onStart: () => void;
  onReady?: () => void;
  onReveal?: () => void;
}

export function useStartScreenBoot({
  onStart,
  onReady,
  onReveal,
}: UseStartScreenBootOptions) {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const revealRafRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (revealRafRef.current !== null) {
        window.cancelAnimationFrame(revealRafRef.current);
      }
    };
  }, []);

  const queueTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
  }, []);

  useEffect(() => {
    const enterTimer = setTimeout(() => {
      setScreenState('entering');
    }, BOOT_CONFIG.enterDelay);

    const readyTimer = setTimeout(() => {
      setScreenState('ready');
    }, BOOT_CONFIG.enterDelay + BOOT_CONFIG.enterDuration);

    timersRef.current.push(enterTimer, readyTimer);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (screenState !== 'ready' || hasStartedRef.current) return;
    hasStartedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    soundManager.unlock();
    soundManager.play('startup');
    setScreenState('glassReveal');

    if (typeof window === 'undefined') {
      onReveal?.();
    } else {
      revealRafRef.current = window.requestAnimationFrame(() => {
        onReveal?.();
        revealRafRef.current = null;
      });
    }

    queueTimer(() => {
      setScreenState('done');
      onStart();
    }, BOOT_CONFIG.revealDuration);
  }, [onReveal, onStart, queueTimer, screenState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      if (screenState === 'ready') handleClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, screenState]);

  return {
    screenState,
    handleClick,
  };
}
