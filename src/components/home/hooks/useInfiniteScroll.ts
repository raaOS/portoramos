"use client"
import { useState, useEffect, useRef } from 'react';

export function useInfiniteScroll(itemsCount: number, batchSize = 14, maxLimit = 1000) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const resetCount = (initialCount = 6) => setVisibleCount(initialCount);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && itemsCount > 0 && visibleCount < maxLimit) {
        setIsLoadingMore(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            setVisibleCount(prev => Math.min(prev + batchSize, maxLimit));
            setIsLoadingMore(false);
          }
        }, 500);
      }
    }, { rootMargin: '800px 0px', threshold: 0.1 });
    
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [itemsCount, visibleCount, isLoadingMore, batchSize, maxLimit]);

  return { visibleCount, isLoadingMore, observerTarget, resetCount };
}
