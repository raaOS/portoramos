'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import FastMarquee from '@/components/ui/FastMarquee';

import { TrailItem } from '@/types/about';

interface GalleryMiniProps {
  images: (string | TrailItem)[];
  className?: string;
}

export default function GalleryMini({ images, className = '' }: GalleryMiniProps) {
  const [open, setOpen] = useState<{ i: number } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const { hideNavbar, showNavbar } = useNavbarVisibility();
  const router = useRouter();

  // Normalize images: filter active only and extract src
  const activeImages = React.useMemo(() => {
    return images
      .map(img => {
        if (typeof img === 'string') return { src: img, slug: null };
        if (img && typeof img === 'object' && img.isActive !== false) return { src: img.src, slug: img.slug || null };
        return null;
      })
      .filter((item): item is { src: string; slug: string | null } => item !== null && item.src.trim() !== '');
  }, [images]);

  const hasMany = activeImages.length > 1;

  const goPrev = useCallback(() => {
    setOpen((o) => (!o ? o : { i: (o.i - 1 + activeImages.length) % activeImages.length }));
  }, [activeImages.length]);

  const goNext = useCallback(() => {
    setOpen((o) => (!o ? o : { i: (o.i + 1) % activeImages.length }));
  }, [activeImages.length]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageClick = (index: number) => {
    const item = activeImages[index];
    if (item.slug) {
      router.push(`/work/${item.slug}`);
    } else {
      hideNavbar();
      setOpen({ i: index });
    }
  };

  // Show loading state until client is ready
  if (!isClient) {
    return (
      <div className={`w-full ${className}`}>
        <div className="w-full overflow-hidden" style={{ contain: 'layout style paint' }}>
          <div className="flex gap-6">
            {activeImages.slice(0, 6).map((item, i) => (
              <div key={i} className="w-48 h-48 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                {(item.src.toLowerCase().endsWith('.mp4') || item.src.toLowerCase().endsWith('.webm')) ? (
                  <video
                    src={item.src}
                    className="w-full h-full object-contain p-1"
                    muted
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={`Gallery ${i + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="192px"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have enough items for a nice dense marquee
  // Duplicate activeImages enough times to ensure it fills a reasonable screen
  const displayImages = activeImages.length < 5
    ? [...activeImages, ...activeImages, ...activeImages, ...activeImages]
    : [...activeImages, ...activeImages];

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full relative">
        <FastMarquee speed={40} direction="left" pauseOnHover={false}>
          {displayImages.map((item, index) => (
            <div
              key={`gallery-${index}`}
              className="flex-shrink-0 cursor-pointer group mr-6"
              onClick={() => handleImageClick(index % activeImages.length)}
            >
              <div className="relative h-48 w-auto overflow-hidden bg-white transition-all duration-300 hover:scale-105 active:scale-95">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {(item.src.toLowerCase().endsWith('.mp4') || item.src.toLowerCase().endsWith('.webm')) ? (
                  <video
                    src={item.src}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={`Gallery image ${index + 1}`}
                    className="h-full w-auto object-contain bg-white"
                    loading="lazy"
                  />
                )}

                {/* View Project Overlay Hint */}
                {item.slug && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="sr-only">View Project</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </FastMarquee>
      </div>

      {/* Gallery Viewer (Legacy/Fallback) */}

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
            className="relative w-full max-w-6xl h-[90vh] rounded-lg bg-black border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 border border-white/15 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white transition flex items-center justify-center"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white transition flex items-center justify-center"
                  onClick={goPrev}
                  aria-label="Previous image"
                  type="button"
                >
                  <span className="text-lg font-semibold">{'<'}</span>
                  <span className="sr-only">Previous image</span>
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white transition flex items-center justify-center"
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
              <div className="absolute top-4 left-4 z-20 text-white bg-black/50 px-3 py-1 rounded-full text-sm border border-white/10">
                {open.i + 1} / {activeImages.length}
              </div>
            )}

            {/* Main image */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <div className="relative w-full h-full">
                <Image
                  src={activeImages[open.i].src}
                  alt={`Gallery image ${open.i + 1}`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                  sizes="(min-width: 768px) 80vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
