"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
const SparklesCore = dynamic(() => import("@/components/ui/Sparkles").then(mod => mod.SparklesCore), { ssr: false });
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { cn, getProxiedUrl } from "@/lib/utils";
import { IconDotsVertical } from "@tabler/icons-react";

interface CompareProps {
  firstImage?: string;
  secondImage?: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
  firstSlideLabel?: string;
  secondSlideLabel?: string;
}

export const Compare = ({
  firstImage = "",
  secondImage = "",
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
  firstSlideLabel = "Original",
  secondSlideLabel = "Retouched",
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
    mass: 1
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
    if (slideMode === "drag") {
      setIsDragging(false);
    }
    startAutoplay();
  };

  const handleStart = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(true);
    }
  }, [slideMode]);

  const handleEnd = useCallback(() => {
    if (slideMode === "drag") {
      setIsDragging(false);
    }
  }, [slideMode]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      if (slideMode === "hover" || (slideMode === "drag" && isDragging)) {
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
    const isVideo = proxiedSrc.toLowerCase().includes('.mp4') || 
                    proxiedSrc.toLowerCase().includes('.webm') ||
                    src.toLowerCase().endsWith('.mp4') || 
                    src.toLowerCase().endsWith('.webm');

    if (isVideo) {
      return (
        <video
          src={proxiedSrc}
          className={cn(className, "object-cover")}
          autoPlay
          loop
          muted
          playsInline
          draggable={false}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={alt}
        src={proxiedSrc}
        className={className}
        draggable={false}
      />
    );
  };

  return (
    <div
      ref={sliderRef}
      className={cn("w-[400px] h-[400px] overflow-hidden relative", className)}
      style={{
        position: "relative",
        cursor: slideMode === "drag" ? "grab" : "col-resize",
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
          className="h-full w-px absolute top-0 m-auto z-30 bg-gradient-to-b from-transparent from-[5%] to-[95%] via-indigo-500 to-transparent"
          style={{
            left: leftPosition, // USE SPRING for handle
          }}
        >
          {/* Sparkles Decoration */}
          <div className="w-36 h-full [mask-image:radial-gradient(100px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-indigo-400 via-transparent to-transparent z-20 opacity-50" />
          <div className="w-10 h-1/2 [mask-image:radial-gradient(50px_at_left,white,transparent)] absolute top-1/2 -translate-y-1/2 left-0 bg-gradient-to-r from-cyan-400 via-transparent to-transparent z-10 opacity-100" />
          <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]">
            <MemoizedSparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
          {showHandlebar && (
            <div className="h-5 w-5 rounded-md top-1/2 -translate-y-1/2 bg-white z-30 -right-2.5 absolute flex items-center justify-center shadow-[0px_-1px_0px_0px_#FFFFFF40]">
              <IconDotsVertical className="h-4 w-4 text-black" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* First Image (Overlay) - Clipped */}
      <div className="overflow-hidden w-full h-full relative z-20 pointer-events-none">
        <AnimatePresence initial={false}>
          {firstImage ? (
            <motion.div
              className={cn(
                "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none overflow-hidden",
                firstImageClassName
              )}
              style={{
                clipPath: clipPathLeft, // USE SPRING
              }}
            >
              {renderMedia(
                firstImage,
                cn(
                  "absolute inset-0 z-20 rounded-2xl shrink-0 w-full h-full select-none",
                  firstImageClassName
                ),
                "first image"
              )}
              {/* Label for First Image (Visible when this layer is visible) */}
              {firstSlideLabel && (
                <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-30">
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
          <div className="absolute inset-0 w-full h-full z-[19]"> {/* Wrap in div to hold label relative to it */}
            {renderMedia(
              secondImage,
              cn(
                "absolute top-0 left-0 z-[19] rounded-2xl w-full h-full select-none",
                secondImageClassname
              ),
              "second image"
            )}
            {/* Label for Second Image (Visible when overlay is clipped away) */}
            {secondSlideLabel && (
              <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-[20]">
                {secondSlideLabel}
              </div>
            )}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MemoizedSparklesCore = React.memo(SparklesCore);
