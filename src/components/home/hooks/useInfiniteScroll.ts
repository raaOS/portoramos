"use client"
import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollStrategy {
  initialCount: number;
  batchSize: number;
  /** Distance from bottom (px) to trigger next batch. */
  preloadThreshold: number;
}

/**
 * Maximum number of loops before stopping.
 * 5 loops × 20 items = 100 DOM nodes — safe for mobile performance.
 */
const MAX_LOOPS = 5;

export function getScrollStrategy(width: number): ScrollStrategy {
  if (width >= 1280) return { initialCount: 12, batchSize: 6, preloadThreshold: 600 };
  if (width >= 1024) return { initialCount: 9,  batchSize: 6, preloadThreshold: 500 };
  if (width >= 640)  return { initialCount: 8,  batchSize: 4, preloadThreshold: 400 };
  return { initialCount: 6, batchSize: 4, preloadThreshold: 300 };
}

const DEFAULT_STRATEGY = getScrollStrategy(1280);

/**
 * Infinite scroll hook with looping support.
 *
 * Items wrap around via modulo so 20 projects repeat seamlessly.
 * Caps at MAX_LOOPS repetitions to prevent unbounded DOM growth.
 */
export function useInfiniteScroll(totalItems: number) {
  const maxVisible = totalItems * MAX_LOOPS;

  const [strategy, setStrategy] = useState(DEFAULT_STRATEGY);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_STRATEGY.initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [ready, setReady] = useState(false);

  // Refs for scroll handler — avoids recreating listener on state changes
  const loadingRef = useRef(false);
  const strategyRef = useRef(strategy);
  const maxRef = useRef(maxVisible);
  const visibleRef = useRef(visibleCount);

  useEffect(() => {
    maxRef.current = maxVisible;
    visibleRef.current = visibleCount;
  }, [maxVisible, visibleCount]);

  const hasMore = totalItems > 0 && visibleCount < maxVisible;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const next = getScrollStrategy(window.innerWidth);
    strategyRef.current = next;
    setTimeout(() => {
      setStrategy(next);
      setVisibleCount(Math.min(next.initialCount, maxVisible));
      setReady(true);
    }, 0);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const s = getScrollStrategy(window.innerWidth);
        strategyRef.current = s;
        setStrategy(s);
      }, 200);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (timer) clearTimeout(timer);
    };
  }, [maxVisible]);

  const resetCount = useCallback(() => {
    const count = Math.min(strategyRef.current.initialCount, maxRef.current);
    setVisibleCount(count);
    visibleRef.current = count;
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, []);

  const loadMore = useCallback(() => {
    if (loadingRef.current || visibleRef.current >= maxRef.current) return;

    loadingRef.current = true;
    setIsLoadingMore(true);

    // Single rAF + microtask — fast enough for skeleton flash, no double delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        setVisibleCount(prev => {
          const next = Math.min(prev + strategyRef.current.batchSize, maxRef.current);
          visibleRef.current = next;
          return next;
        });
        loadingRef.current = false;
        setIsLoadingMore(false);
      }, 100);
    });
  }, []);

  // Single scroll listener — never recreated
  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;

    let ticking = false;

    const check = () => {
      ticking = false;
      if (loadingRef.current || visibleRef.current >= maxRef.current) return;

      const bottom = window.scrollY + window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      if (bottom >= docH - strategyRef.current.preloadThreshold) {
        loadMore();
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial check for short pages
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [ready, loadMore]);

  // After each batch, check if page is still short enough to auto-load more
  useEffect(() => {
    if (!ready || loadingRef.current || visibleRef.current >= maxRef.current) return;
    if (typeof window === 'undefined') return;

    const id = requestAnimationFrame(() => {
      const bottom = window.scrollY + window.innerHeight;
      if (bottom >= document.documentElement.scrollHeight - strategyRef.current.preloadThreshold) {
        loadMore();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visibleCount, ready, loadMore]);

  return {
    visibleCount: Math.min(visibleCount, maxVisible),
    isLoadingMore,
    hasMore,
    resetCount,
    initialCount: strategy.initialCount,
  };
}
