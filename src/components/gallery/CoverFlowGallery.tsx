'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom'; // For Modal Portal
import { AnimatePresence, motion } from 'framer-motion';
import Media from '@/components/shared/Media';
import { TRAIL_PLACEHOLDER_IMAGES } from '@/data/trailPlaceholders';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  aspectRatio?: number;
  type?: 'image' | 'video';
  poster?: string;
  isHero?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
}

interface CoverFlowGalleryProps {
  items?: Photo[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  className?: string;
  onPhotoSelect?: (photo: Photo) => void;
  onVideoRef?: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  videoRef?: React.RefObject<HTMLVideoElement> | null;
  coverKind?: string;
  aspectRatio?: number;
}

const defaultPhotos: Photo[] = TRAIL_PLACEHOLDER_IMAGES.map((item, index) => ({
  id: `${index + 1}`,
  src: item.src,
  alt: item.alt,
  title: item.title,
  aspectRatio: item.aspectRatio ?? 1.0,
  type: 'image'
}));

// Reusing the Photo/Modal logic somewhat, but drastically simplified for Flat Carousel
export default function CoverFlowGallery({
  items,
  aspectRatio = 16 / 9,
  className = '',
  onVideoRef
}: CoverFlowGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Prepare Items
  const galleryPhotos: Photo[] = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, index) => ({
        id: item.id || `gallery-${index}`,
        src: item.src,
        alt: item.alt || '',
        title: item.title || '',
        type: item.type || 'image',
        poster: item.poster,
        isHero: item.isHero,
        autoplay: item.autoplay,
        muted: item.muted,
        loop: item.loop
      }));
    }
    return defaultPhotos;
  }, [items]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Scroll Handler to update index
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setCurrentIndex(index);
  }, []);

  const scrollTo = (index: number) => {
    if (!scrollContainerRef.current) return;
    const width = scrollContainerRef.current.clientWidth;
    scrollContainerRef.current.scrollTo({
      left: width * index,
      behavior: 'smooth'
    });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = Math.max(0, currentIndex - 1);
    scrollTo(newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = Math.min(galleryPhotos.length - 1, currentIndex + 1);
    scrollTo(newIndex);
  };

  // Modal Logic
  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo);
    setZoomLevel(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  // Prevent rendering issues
  if (!isClient) {
    return (
      <div
        className={`w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl ${className}`}
        style={{ aspectRatio }}
      />
    );
  }

  return (
    <>
      {/* CAROUSEL CONTAINER */}
      <div
        className={`group relative w-full overflow-hidden bg-gray-50 dark:bg-gray-900 ${className}`}
        style={{ aspectRatio }}
      >
        {/* Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
          style={{ scrollBehavior: 'smooth' }}
        >
          {galleryPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-black/5 dark:bg-white/5"
              onClick={() => openModal(photo)}
            >
              <div className="relative w-full h-full">
                <Media
                  kind={photo.type === 'video' ? 'video' : 'image'}
                  src={photo.src}
                  poster={photo.poster}
                  alt={photo.alt}
                  width={1200}
                  height={1200}
                  className="w-full h-full object-contain cursor-zoom-in"
                  autoplay={index === currentIndex} // Only play if active slide
                  muted={true}
                  loop={true}
                  playsInline={true}
                  controls={false}
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CONTROLS OVERLAY */}
        {/* 1. Counter Badge (Instagram Style) */}
        <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-medium tracking-wide border border-white/10">
          {currentIndex + 1} / {galleryPhotos.length}
        </div>

        {/* 2. Navigation Arrows (Desktop Hover) */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex border border-black/5"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        )}

        {currentIndex < galleryPhotos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-black/80 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex border border-black/5"
          >
            <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        )}

        {/* 3. Dots Indicator (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 p-2 rounded-full">
          {galleryPhotos.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex
                ? 'bg-white w-2 scale-125'
                : 'bg-white/50 hover:bg-white/80'
                }`}
            />
          ))}
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {isClient && createPortal(
        <AnimatePresence>
          {isModalOpen && selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
              onClick={closeModal} // Click outside to close
            >
              {/* Toolbar */}
              <div className="absolute top-4 right-4 z-50 flex gap-4">
                {/* Zoom controls could go here, keeping it simple for now */}
                <button
                  onClick={closeModal}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center pointer-events-none" // pointer-events-none to let clicks pass to backdrop
              >
                <div className="pointer-events-auto w-full h-full flex items-center justify-center">
                  <Media
                    kind={selectedPhoto.type === 'video' ? 'video' : 'image'}
                    src={selectedPhoto.src}
                    poster={selectedPhoto.poster}
                    alt={selectedPhoto.title}
                    width={1600}
                    height={1200}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    objectFit="contain" // Critical: Overrides default 'cover' in Media component
                    priority={true} // Immediate load for lightbox
                    autoplay={true}
                    muted={false} // Unmute in lightbox
                    loop={true}
                    controls={true} // Controls allowed in lightbox
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
