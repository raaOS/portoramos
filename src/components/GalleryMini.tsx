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
    setOpen((o) => (!o ? o : { i: (o.i - 1 + images.length) % images.length }));
  }, [images.length]);

  const goNext = useCallback(() => {
    setOpen((o) => (!o ? o : { i: (o.i + 1) % images.length }));
  }, [images.length]);

  const enterFullscreen = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } catch (e) {
      // Fullscreen request failed (likely not supported)
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
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key.toLowerCase() === 'f') {
        enterFullscreen();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goPrev, goNext, enterFullscreen, isClient, showNavbar]);

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (!isClient) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;

    if (open) {
      body.style.overflow = 'hidden';
    }

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open, isClient]);

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
    <div className={`w-full max-w-[450px] md:max-w-[480px] ${className}`}>
      <div className="w-full overflow-hidden relative">
        <div
          className="flex"
          style={{
            transform: `translateX(-${scrollPosition}px)`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => {
            showNavbar();
            setOpen(null);
          }}
        >
          <div
            ref={viewerRef}
            className="relative w-full max-w-5xl h-[70vh] md:h-[80vh] rounded-2xl bg-gradient-to-b from-gray-900/80 to-black/60 border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 border border-white/15 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition"
              onClick={() => {
                showNavbar();
                setOpen(null);
              }}
              aria-label="Close gallery"
              type="button"
            >
              <span className="text-lg font-semibold">X</span>
            </button>

            {/* Prev / Next controls */}
            {hasMany && (
              <>
                <button
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition flex items-center justify-center"
                  onClick={goPrev}
                  aria-label="Previous image"
                  type="button"
                >
                  <span className="text-lg font-semibold">{'<'}</span>
                  <span className="sr-only">Previous image</span>
                </button>
                <button
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition flex items-center justify-center"
                  onClick={goNext}
                  aria-label="Next image"
                  type="button"
                >
                  <span className="text-lg font-semibold">{'>'}</span>
                  <span className="sr-only">Next image</span>
                </button>
              </>
            )}

            {/* Image counter */}
            {hasMany && (
              <div className="absolute top-4 left-4 text-white bg-black/60 px-3 py-1 rounded-full text-sm z-10 border border-white/10">
                {open.i + 1} / {images.length}
              </div>
            )}

            {/* Main image */}
            <div className="absolute inset-0 flex items-center justify-center px-6 md:px-10">
              <div className="relative w-full h-full">
                <Image
                  src={images[open.i]}
                  alt={`Gallery image ${open.i + 1}`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                  sizes="(min-width: 768px) 80vw, 100vw"
                />
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs md:text-sm text-white/80 bg-black/60 px-4 py-2 rounded-full border border-white/10">
              {hasMany && <span className="mr-3">Left/Right: Navigate</span>}
              <span className="mr-3">F: Fullscreen</span>
              <span>Esc: Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
