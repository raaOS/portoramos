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
import { cn, getProxiedUrl } from '@/lib/utils';
import { IconDotsVertical } from '@tabler/icons-react';

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
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
  const [, setIsMouseOver] = useState(false);

  // Motion values for smooth interaction
  const x = useMotionValue(0);
  const width = useMotionValue(0); // Cache width to avoid layout thrashing

  // Spring physics for natural movement (damping: smoothens the stop, stiffness: responsiveness)
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
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

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
      autoplayRef.current = setTimeout(animate, 16);
    };

    animate();
  }, [autoplay, autoplayDuration, x, width]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearTimeout(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  // Update width on resize
  useEffect(() => {
    if (!sliderRef.current) return;

    const element = sliderRef.current;

    // Initial measure
    const rect = element.getBoundingClientRect();
    width.set(rect.width);
    x.set((initialSliderPercentage / 100) * rect.width);

    // Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // Use measure for consistent box model
          const newWidth = entry.contentRect.width;
          width.set(newWidth);
          // Optional: Keep relative percentage? For now, keep absolute X for stability or re-calc.
          // let's just update width, X stays (so percentage drops/gains).
          // It's acceptable for edge case.
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
    setIsMouseOver(true);
    stopAutoplay();
  };

  const mouseLeaveHandler = () => {
    setIsMouseOver(false);
    // Removed auto-reset to center. Slider stays where user left it.
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
        // Clamp value
        x.set(Math.max(0, Math.min(w, newX)));
      }
    },
    [slideMode, isDragging, x, width]
  );

  const renderMedia = (src: string, className: string, alt: string) => {
    const proxiedSrc = getProxiedUrl(src);
    const isVideo =
      proxiedSrc.toLowerCase().includes('.mp4') ||
      proxiedSrc.toLowerCase().includes('.webm') ||
      src.toLowerCase().endsWith('.mp4') ||
      src.toLowerCase().endsWith('.webm');

    if (isVideo) {
      return (
        <video
          src={proxiedSrc}
          className={cn(className, 'object-cover')}
          autoPlay
          loop
          muted
          playsInline
          draggable={false}
        />
      );
    }

    return <img alt={alt} src={proxiedSrc} className={className} draggable={false} />;
  };

  return (
    <div
      ref={sliderRef}
      className={cn('relative h-[400px] w-[400px] overflow-hidden', className)}
      style={{
        position: 'relative',
        cursor: slideMode === 'drag' ? 'grab' : 'col-resize',
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
      {/* Slider Handle Line */}
      <AnimatePresence initial={false}>
        <motion.div
          className="absolute top-0 z-30 m-auto h-full w-px bg-gradient-to-b from-transparent from-[5%] via-indigo-500 to-transparent to-[95%]"
          style={{
            left: leftPosition, // USE SPRING for handle
          }}
        >
          {showHandlebar && (
            <div className="absolute -right-2.5 top-1/2 z-30 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md bg-white shadow-[0px_-1px_0px_0px_#FFFFFF40]">
              <IconDotsVertical className="h-4 w-4 text-black" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

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
                clipPath: clipPathLeft, // USE SPRING
              }}
            >
              {renderMedia(
                firstImage,
                cn(
                  'absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none',
                  firstImageClassName
                ),
                'first image'
              )}
              {/* Label for First Image (Visible when this layer is visible) */}
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
            {' '}
            {/* Wrap in div to hold label relative to it */}
            {renderMedia(
              secondImage,
              cn(
                'absolute top-0 left-0 z-[19] rounded-2xl w-full h-full select-none',
                secondImageClassname
              ),
              'second image'
            )}
            {/* Label for Second Image (Visible when overlay is clipped away) */}
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
