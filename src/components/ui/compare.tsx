'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'motion/react';
import { cn } from '@/lib/utils';
import { CompareMedia } from './compare/CompareMedia';
import { CompareHandlebar } from './compare/CompareHandlebar';

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  firstMediaType?: 'image' | 'video';
  secondMediaType?: 'image' | 'video';
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: 'hover' | 'drag';
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
  firstSlideLabel?: string;
  secondSlideLabel?: string;
}

export const Compare = ({
  firstImage = '',
  secondImage = '',
  firstMediaType,
  secondMediaType,
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = 'hover',
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
  firstSlideLabel = 'Original',
  secondSlideLabel = 'Retouched',
}: CompareProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Motion values for smooth interaction
  const x = useMotionValue(0);
  const width = useMotionValue(0);

  // Spring physics for natural movement
  const springX = useSpring(x, {
    stiffness: 400,
    damping: 30,
    mass: 1,
  });

  const percentage = useTransform(() => {
    const w = width.get();
    if (w === 0) return initialSliderPercentage;
    const currentX = springX.get();
    return (currentX / w) * 100;
  });

  const clipPathLeft = useMotionTemplate`inset(0 ${useTransform(percentage, (p) => 100 - p)}% 0 0)`;
  const leftPosition = useMotionTemplate`${percentage}%`;

  // Autoplay Effect
  const autoplayRef = useRef<number | null>(null);

  const startAutoplay = useCallback(() => {
    if (!autoplay) return;

    const startTime = Date.now();
    const animate = () => {
      const w = width.get();
      if (w === 0) return;

      const elapsedTime = Date.now() - startTime;
      const progress = (elapsedTime % (autoplayDuration * 2)) / autoplayDuration;
      const currentPercent = progress <= 1 ? progress * 100 : (2 - progress) * 100;
      const nextX = (currentPercent / 100) * w;

      x.set(nextX);
      autoplayRef.current = requestAnimationFrame(animate) as unknown as number;
    };

    animate();
  }, [autoplay, autoplayDuration, x, width]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current !== null) {
      cancelAnimationFrame(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  // Update width on resize
  useEffect(() => {
    if (!sliderRef.current) return;
    const element = sliderRef.current;

    const rect = element.getBoundingClientRect();
    width.set(rect.width);
    x.set((initialSliderPercentage / 100) * rect.width);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const newWidth = entry.contentRect.width;
          width.set(newWidth);
        }
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [initialSliderPercentage, x, width]);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);

  const mouseEnterHandler = () => {
    stopAutoplay();
  };

  const mouseLeaveHandler = () => {
    if (slideMode === 'drag') {
      setIsDragging(false);
    }
    startAutoplay();
  };

  const handleStart = useCallback(() => {
    if (slideMode === 'drag') {
      setIsDragging(true);
    }
  }, [slideMode]);

  const handleEnd = useCallback(() => {
    if (slideMode === 'drag') {
      setIsDragging(false);
    }
  }, [slideMode]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
        const rect = sliderRef.current.getBoundingClientRect();
        const newX = clientX - rect.left;
        const w = width.get();
        x.set(Math.max(0, Math.min(w, newX)));
      }
    },
    [slideMode, isDragging, x, width]
  );

  return (
    <div
      ref={sliderRef}
      role="slider"
      aria-label={
        firstSlideLabel && secondSlideLabel
          ? `Compare ${firstSlideLabel} vs ${secondSlideLabel}`
          : 'Image comparison slider'
      }
      aria-valuenow={Math.round(initialSliderPercentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      data-no-window-drag
      className={cn('relative h-[400px] w-[400px] select-none touch-none overflow-hidden', className)}
      style={{
        position: 'relative',
        cursor: slideMode === 'drag' ? 'grab' : 'col-resize',
      }}
      onKeyDown={(e) => {
        const step = 2;
        const w = width.get();
        if (w === 0) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const currentX = x.get();
          x.set(Math.max(0, currentX - (step / 100) * w));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const currentX = x.get();
          x.set(Math.min(w, currentX + (step / 100) * w));
        }
      }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseLeave={mouseLeaveHandler}
      onMouseEnter={mouseEnterHandler}
      onMouseDown={(e) => {
        handleStart();
        handleMove(e.clientX);
      }}
      onMouseUp={handleEnd}
      onTouchStart={(e) => {
        handleStart();
        handleMove(e.touches[0].clientX);
      }}
      onTouchEnd={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <CompareHandlebar leftPosition={leftPosition} showHandlebar={showHandlebar} />

      {/* First Image (Overlay) - Clipped */}
      <div className="pointer-events-none relative z-20 h-full w-full overflow-hidden">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                'absolute inset-0 z-20 h-full w-full shrink-0 select-none overflow-hidden rounded-2xl',
                firstImageClassName
              )}
              style={{
                clipPath: clipPathLeft,
              }}
            >
              <CompareMedia
                src={firstImage}
                className={cn(
                  'absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none',
                  firstImageClassName
                )}
                alt="first image"
                mediaType={firstMediaType}
              />
              {firstSlideLabel && (
                <div className="absolute left-4 top-4 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  {firstSlideLabel}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Second Image (Base) */}
      <AnimatePresence initial={false}>
        {secondImage ? (
          <div className="absolute inset-0 z-[19] h-full w-full">
            <CompareMedia
              src={secondImage}
              className={cn(
                'absolute top-0 left-0 z-[19] rounded-2xl w-full h-full select-none',
                secondImageClassname
              )}
              alt="second image"
              mediaType={secondMediaType}
            />
            {secondSlideLabel && (
              <div className="absolute right-4 top-4 z-[20] rounded bg-black/70 px-2 py-1 text-xs text-white">
                {secondSlideLabel}
              </div>
            )}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
