'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';

interface GalleryMiniProps {
  images: string[];
  className?: string;
}

export default function GalleryMini({ images, className = '' }: GalleryMiniProps) {
  const [open, setOpen] = useState<{ i: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const hasMany = images.length > 1;
  const { hideNavbar, showNavbar } = useNavbarVisibility();

  const goPrev = useCallback(() => {
    setOpen((o) => !o ? o : ({ i: (o.i - 1 + images.length) % images.length }));
  }, [images.length]);

  const goNext = useCallback(() => {
    setOpen((o) => !o ? o : ({ i: (o.i + 1) % images.length }));
  }, [images.length]);

  const enterFullscreen = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        ; (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        ; (el as any).msRequestFullscreen();
      }
    } catch (e) {
      // Failed to enter fullscreen
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!open || !isClient) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        showNavbar();
        setOpen(null);
      }
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key.toLowerCase() === 'f') enterFullscreen();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goPrev, goNext, enterFullscreen, isClient, showNavbar]);

  // Auto-scroll animation (left to right) with seamless looping - SAME AS HorizontalCounterAnimation
  useEffect(() => {
    if (!isClient || images.length === 0) return;

    const itemWidth = 96 + 16; // w-24 (96px) + gap-4 (16px)
    const totalWidth = images.length * itemWidth;
    let animationId: number;
    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;

      // Calculate position based on time for consistent speed
      const elapsed = currentTime - startTime;
      const speed = 0.05; // pixels per millisecond (same as HorizontalCounterAnimation)
      const position = (elapsed * speed) % totalWidth;

      setScrollPosition(position);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [images.length, isClient]);

  const handleImageClick = (index: number) => {
    hideNavbar();
    setOpen({ i: index });
  };

  // Show loading state until client is ready
  if (!isClient) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full overflow-hidden" style={{ contain: 'layout style paint' }}>
          <div className="flex gap-4">
            {images.slice(0, 6).map((image, i) => (
              <div key={i} className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                <Image
                  src={image}
                  alt={`Gallery ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full overflow-hidden relative"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)'
        }}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${scrollPosition}px)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Multiple duplicates for seamless infinite loop - 3 sets like HorizontalCounterAnimation */}
          {[...images, ...images, ...images].map((image, index) => (
            <div
              key={`gallery-${index}`}
              className="flex-shrink-0 cursor-pointer group mr-4"
              onClick={() => handleImageClick(index % images.length)}
            >
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white">
                <Image
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className="object-cover filter grayscale hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                  sizes="96px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Viewer */}
      {open && isClient && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => {
            showNavbar();
            setOpen(null);
          }}
        >
          <div
            ref={viewerRef}
            className="relative max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between px-1">
              <button
                className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                onClick={() => {
                  showNavbar();
                  setOpen(null);
                }}
                aria-label="Close gallery"
                type="button"
              >
                Tutup (Esc)
              </button>

              <div className="flex items-center gap-3">
                {hasMany && (
                  <>
                    <button
                      className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                      onClick={goPrev}
                      aria-label="Previous image"
                      type="button"
                    >
                      ← Prev
                    </button>
                    <button
                      className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                      onClick={goNext}
                      aria-label="Next image"
                      type="button"
                    >
                      Next →
                    </button>
                  </>
                )}

                <button
                  className="text-white/80 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded"
                  onClick={enterFullscreen}
                  aria-label="Enter fullscreen"
                  type="button"
                >
                  Fullscreen (F)
                </button>
              </div>
            </div>

            {/* Image counter */}
            {hasMany && (
              <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm z-10">
                {open.i + 1} / {images.length}
              </div>
            )}

            {/* Main image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[open.i]}
                alt={`Gallery image ${open.i + 1}`}
                width={1200}
                height={800}
                className="object-contain max-w-full max-h-full rounded-lg"
                priority
              />
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {hasMany && 'Arrow keys: Navigate • '}
              F: Fullscreen • ESC: Close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
