'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Media from '@/components/shared/Media';
import { useModal } from '@/contexts/ModalContext';
import AudioControl from '@/components/features/AudioControl';
import { useNavbarVisibility } from '@/contexts/NavbarVisibilityContext';
import { TRAIL_PLACEHOLDER_IMAGES } from '@/data/trailPlaceholders';

interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  aspectRatio?: number;
  type?: 'image' | 'video';
  poster?: string; // For video thumbnails
  isHero?: boolean; // For hero image/video
  ratio?: number; // For hero aspect ratio
  autoplay?: boolean; // For hero video autoplay
  muted?: boolean; // For hero video muted
  loop?: boolean; // For hero video loop
  playsInline?: boolean; // For hero video playsInline
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

// Performance: Memoized fallback image to prevent recreation
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="170" height="170" viewBox="0 0 170 170"%3E%3Crect width="170" height="170" fill="%23f3f4f6"/%3E%3Ctext x="85" y="85" text-anchor="middle" fill="%236b7280" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';

const defaultPhotos: Photo[] = TRAIL_PLACEHOLDER_IMAGES.map((item, index) => ({
  id: `${index + 1}`,
  src: item.src,
  alt: item.alt,
  title: item.title,
  aspectRatio: item.aspectRatio ?? 1.0,
  type: 'image'
}));

// Performance: Memoized Photo Item Component
const PhotoItem = memo(({
  photo,
  index,
  currentIndex,
  totalPhotos,
  onPhotoClick,
  onImageLoad,
  onImageError,
  imageErrors,
  onVideoRef,
  fillContainer
}: {
  photo: Photo;
  index: number;
  currentIndex: number;
  totalPhotos: number;
  onPhotoClick: (photo: Photo) => void;
  onImageLoad: (id: string) => void;
  onImageError: (id: string) => void;
  imageErrors: Set<string>;
  onVideoRef?: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  fillContainer?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update video ref when it changes - for hero video
  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef);
    }
  }, [videoRef, onVideoRef]);

  // Memoized calculations for better performance
  const { transform, zIndex, isVisible, imageSize } = useMemo(() => {
    const getResponsiveBaseSize = () => {
      if (typeof window === 'undefined') return 300;
      if (window.innerWidth < 768) return 200;
      if (window.innerWidth < 1024) return 250;
      return 300;
    };

    const baseSize = getResponsiveBaseSize();

    // Calculate size based on aspect ratio
    const itemRatio = photo.ratio || photo.aspectRatio || 1;
    let width = baseSize;
    let height = baseSize;

    if (itemRatio < 1) {
      // Portrait: Keep width fixed, increase height
      width = baseSize;
      height = baseSize / itemRatio;
    } else {
      // Landscape: Keep height fixed, increase width
      height = baseSize;
      width = baseSize * itemRatio;
    }

    const size = { width, height };

    // Optimized position calculation
    const normalizePosition = (pos: number) => ((pos % totalPhotos) + totalPhotos) % totalPhotos;
    let relativePosition = normalizePosition(index - currentIndex);

    // Adjust for shortest path in circular array
    if (relativePosition > totalPhotos / 2) {
      relativePosition -= totalPhotos;
    }

    const maxRange = totalPhotos <= 3 ? 2 : 3;
    const isVisible = Math.abs(relativePosition) <= maxRange;

    if (!isVisible) return { transform: '', zIndex: 0, isVisible: false, imageSize: size };

    const translatePercentage = totalPhotos <= 3 ? 50 : 70;
    let transformStr = '';
    let z = 10;

    if (relativePosition < 0) {
      const offset = Math.abs(relativePosition);
      if (offset === 2) {
        transformStr = `translateX(-${translatePercentage * offset}%) rotateY(60deg) translateZ(-50px) scale(0.7)`;
        z = 5;
      } else {
        transformStr = `translateX(-${translatePercentage * offset}%) rotateY(45deg)`;
        z = 10 + (totalPhotos + relativePosition);
      }
    } else if (relativePosition === 0) {
      if (fillContainer) {
        transformStr = 'rotateY(0deg) translateZ(0px)'; // Flat for exact fit
      } else {
        transformStr = 'rotateY(0deg) translateZ(140px)'; // Pop out for standard
      }
      z = 42;
    } else {
      transformStr = `translateX(${translatePercentage * relativePosition}%) rotateY(-45deg)`;
      z = 10 + (totalPhotos - relativePosition);
    }

    return { transform: transformStr, zIndex: z, isVisible: true, imageSize: size };
  }, [index, currentIndex, totalPhotos, fillContainer]);

  // Early return if not visible for performance
  if (!isVisible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPhotoClick(photo);
    }
  };

  const getImageSource = () => {
    if (imageErrors.has(photo.id)) return FALLBACK_IMAGE;
    return photo.type === 'video' ? (photo.poster || photo.src) : photo.src;
  };

  return (
    <motion.div
      className="absolute cursor-pointer focus:outline-none outline-none rounded-lg overflow-visible"
      style={{
        left: fillContainer ? '0' : '50%',
        top: fillContainer ? '0' : '50%',
        width: fillContainer ? '100%' : `${imageSize.width}px`,
        height: fillContainer ? '100%' : `${imageSize.height}px`,
        marginLeft: fillContainer ? '0' : `-${imageSize.width / 2}px`,
        marginTop: fillContainer ? '0' : `-${imageSize.height / 2}px`,
        transformOrigin: 'center center',
        zIndex,
        transformStyle: 'preserve-3d',
      }}
      animate={{ transform }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        type: "tween"
      }}
      onClick={() => onPhotoClick(photo)}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      role="button"
      tabIndex={0}
      aria-label={`View ${photo.title}. ${photo.type === 'video' ? 'Video content' : 'Image'}`}
    >
      <div
        className="w-full h-full bg-gray-50/5 rounded-lg overflow-hidden relative"
      >
        {/* Unified Media Component for Image & Video */}
        <div className="relative w-full h-full z-10 flex items-center justify-center p-0.5">
          <Media
            kind={photo.type === 'video' ? 'video' : 'image'}
            src={photo.src}
            poster={photo.poster}
            alt={photo.alt}
            width={800}
            height={600}
            priority={Math.abs(index - currentIndex) <= 1} // Prioritize current and adjacent
            className="w-full h-full object-contain pointer-events-none" // pointer-events-none to prevent dragging image ghost
            autoplay={photo.isHero} // Only autoplay if hero
            muted={true}
            loop={true}
            playsInline={true}
            sizes="(max-width: 768px) 300px, 600px" // Appropriate sizes for gallery items
            ref={photo.isHero ? videoRef : undefined}
            objectFit="contain"
          />
        </div>

      </div>
    </motion.div>
  );
});

PhotoItem.displayName = 'PhotoItem';

// Main Gallery Component
export default function CoverFlowGallery({
  items,
  autoPlay = true,
  autoPlayInterval = 3000,
  showControls = true,
  className = '',
  onPhotoSelect,
  onVideoRef,
  videoRef: externalVideoRef,
  coverKind,
  aspectRatio
}: CoverFlowGalleryProps) {
  const { setIsModalOpen } = useModal();

  // Create internal videoRef for modal video
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Use external videoRef for modal if provided, otherwise use internal modal ref
  const videoRef = externalVideoRef || modalVideoRef;

  // Update parent with modal video ref
  useEffect(() => {
    if (videoRef && onVideoRef) {
      onVideoRef(videoRef);
    }
  }, [videoRef, onVideoRef]);

  // Convert items to photos format with better typing
  const galleryPhotos: Photo[] = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, index) => ({
        id: item.id || `gallery-${index}`,
        src: item.src,
        alt: item.alt || `Gallery item ${index + 1}`,
        title: item.title || `Gallery item ${index + 1}`,
        aspectRatio: item.aspectRatio || 1.0,
        type: item.type || 'image',
        poster: item.poster,
        isHero: item.isHero || false,
        ratio: item.ratio,
        autoplay: item.autoplay,
        muted: item.muted,
        loop: item.loop,
        playsInline: item.playsInline
      }));
    }
    return defaultPhotos;
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(galleryPhotos.length / 2));
  const [isClient, setIsClient] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(autoPlay ?? false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasPlayedWithAudio, setHasPlayedWithAudio] = useState(false);

  // Touch handling with better state management
  const [touchState, setTouchState] = useState<{
    startX: number | null;
    endX: number | null;
    isTracking: boolean;
  }>({ startX: null, endX: null, isTracking: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseOverRef = useRef(false);

  // FIXED: Optimized navigation functions with proper boundary handling
  const flowLeft = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev - 1;
      return next < 0 ? galleryPhotos.length - 1 : next;
    });
  }, [galleryPhotos.length]);

  const flowRight = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      return next >= galleryPhotos.length ? 0 : next;
    });
  }, [galleryPhotos.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < galleryPhotos.length) {
      setCurrentIndex(index);
    }
  }, [galleryPhotos.length]);

  // Optimized image handling
  const handleImageLoad = useCallback((photoId: string) => {
    // Image loaded successfully - no action needed
  }, []);

  const handleImageError = useCallback((photoId: string) => {
    setImageErrors(prev => new Set(prev).add(photoId));
  }, []);

  // Enhanced touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchState({
      startX: e.targetTouches[0].clientX,
      endX: null,
      isTracking: true
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchState.isTracking) {
      setTouchState(prev => ({
        ...prev,
        endX: e.targetTouches[0].clientX
      }));
    }
  }, [touchState.isTracking]);

  const handleTouchEnd = useCallback(() => {
    const { startX, endX } = touchState;
    if (!startX || !endX) return;

    const distance = startX - endX;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        flowLeft(); // Swipe left = go left
      } else {
        flowRight(); // Swipe right = go right
      }
    }

    setTouchState({ startX: null, endX: null, isTracking: false });
  }, [touchState, flowLeft, flowRight]);

  // Photo modal handlers
  const { hideNavbar, showNavbar } = useNavbarVisibility();

  // Audio control callbacks
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef?.current && !hasPlayedWithAudio) {
      videoRef.current.muted = false;
      setHasPlayedWithAudio(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎵 Video auto unmuted on load (first time)');
      }
    }
  }, [videoRef, hasPlayedWithAudio]);

  const handleVideoPlay = useCallback(() => {
    if (videoRef?.current && !hasPlayedWithAudio && videoRef.current.muted) {
      videoRef.current.muted = false;
      setHasPlayedWithAudio(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🎵 Video auto unmuted on play (first time)');
      }
    }
  }, [videoRef, hasPlayedWithAudio]);

  const handleVideoEnded = useCallback(() => {
    if (videoRef?.current) {
      videoRef.current.muted = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔇 Video auto muted on end');
      }
    }
  }, [videoRef]);

  const openPhotoModal = useCallback((photo: Photo) => {
    // hideNavbar(); // Removed as per user request to keep navbar visible
    setSelectedPhoto(photo);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setHasPlayedWithAudio(false); // Reset audio state for new video
    setIsModalOpen(true);
    onPhotoSelect?.(photo);
  }, [onPhotoSelect, setIsModalOpen]);

  const closePhotoModal = useCallback(() => {
    // showNavbar(); // Removed as per user request
    setSelectedPhoto(null);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  // Zoom and pan handlers
  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => {
      const newZoom = Math.max(0.5, Math.min(5, prev + delta));
      return newZoom;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Enhanced auto-play with mouse pause
  useEffect(() => {
    if (isAutoPlayActive && !selectedPhoto && !isMouseOverRef.current) {
      const interval = galleryPhotos.length <= 3 ? Math.max(autoPlayInterval, 4000) : autoPlayInterval;

      autoPlayRef.current = setInterval(() => {
        flowRight();
      }, interval);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [isAutoPlayActive, selectedPhoto, autoPlayInterval, galleryPhotos.length, flowRight]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          flowLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          flowRight();
          break;
        case 'Escape':
          e.preventDefault();
          closePhotoModal();
          break;
        case ' ':
          if (!selectedPhoto) {
            e.preventDefault();
            setIsAutoPlayActive(prev => !prev);
          }
          break;
        case 'Home':
          e.preventDefault();
          goToIndex(0);
          break;
        case 'End':
          e.preventDefault();
          goToIndex(galleryPhotos.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flowLeft, flowRight, closePhotoModal, selectedPhoto, goToIndex, galleryPhotos.length]);

  // Mouse hover handlers for auto-play pause
  const handleMouseEnter = useCallback(() => {
    isMouseOverRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseOverRef.current = false;
  }, []);

  // Skeleton placeholder during SSR to prevent CLS
  if (!isClient) {
    return (
      <div
        className={`relative rounded-xl gallery-container ${className}`}
        style={{
          minHeight: aspectRatio ? 'auto' : '450px',
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
          height: aspectRatio ? 'auto' : '450px',
          paddingTop: aspectRatio ? '10px' : '20px',
          paddingBottom: aspectRatio ? '10px' : '0',
          maxWidth: aspectRatio ? (aspectRatio < 1 ? '300px' : (aspectRatio === 1 ? '450px' : '600px')) : '1000px', // Portrait: 300px, Square: 450px, Landscape: 600px
          width: '100%',
          marginTop: '0', // Removed negative margin to prevent clipping
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'block',
          contain: 'layout style paint'
        }}
      >
        <div
          className="relative flex items-center justify-center w-full h-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl"
          style={{ height: aspectRatio ? '100%' : '450px' }}
        >
          <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl gallery-container ${className}`}
      style={{
        minHeight: aspectRatio ? 'auto' : '450px',
        height: aspectRatio ? 'auto' : '450px',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        paddingTop: aspectRatio ? '10px' : '20px', // Added safety padding
        paddingBottom: aspectRatio ? '10px' : '0',
        maxWidth: aspectRatio ? (aspectRatio < 1 ? '300px' : (aspectRatio === 1 ? '450px' : '600px')) : '1000px', // Refined logic 300/450/600
        width: '100%',
        marginTop: '0', // Fixed clipping issue
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'block',
        contain: 'layout style paint'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* CoverFlow Container */}
      <div
        className="relative flex items-center justify-center w-full h-full overflow-visible coverflow-container"
        style={{
          perspective: '600px',
          height: '100%',
          maxWidth: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Photo gallery with coverflow effect"
        aria-live="polite"
      >
        {/* Photos */}
        {galleryPhotos.map((photo, index) => (
          <PhotoItem
            key={photo.id}
            photo={photo}
            index={index}
            currentIndex={currentIndex}
            totalPhotos={galleryPhotos.length}
            onPhotoClick={openPhotoModal}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            imageErrors={imageErrors}
            onVideoRef={onVideoRef}
            fillContainer={!!aspectRatio}
          />
        ))}
      </div>

      {/* Enhanced Controls */}
      {showControls && (
        <>

          {/* Sound Control - Top Right (for videos only) */}
          {selectedPhoto?.type === 'video' && (
            <div className="absolute top-4 right-4 z-50">
              <AudioControl videoRef={videoRef} />
            </div>
          )}
        </>
      )}

      {/* Enhanced Modal Lightbox - PORTAL to escape parent clipping */}
      {isClient && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={closePhotoModal}
              role="dialog"
              aria-modal="true"
              aria-label={`Viewing ${selectedPhoto.title}`}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Enhanced Close Button */}
                <motion.button
                  onClick={closePhotoModal}
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>

                {/* Zoom Controls */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <button
                    onClick={() => handleZoom(-0.2)}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Zoom out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleZoom(0.2)}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Zoom in"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="Reset zoom"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Zoom Level Indicator */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>

                {/* Media Content */}
                <div
                  className="relative w-full h-full flex items-center justify-center overflow-hidden"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                >
                  {selectedPhoto.type === 'video' ? (
                    <video
                      ref={videoRef}
                      src={selectedPhoto.src}
                      poster={selectedPhoto.poster}
                      controls
                      autoPlay={selectedPhoto.autoplay ?? true}
                      muted={selectedPhoto.muted ?? true}
                      loop={selectedPhoto.loop ?? true}
                      playsInline={selectedPhoto.playsInline ?? true}
                      className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200"
                      style={{
                        maxHeight: '90vh',
                        maxWidth: '90vw',
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                      }}
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onEnded={handleVideoEnded}
                      onPlay={handleVideoPlay}
                    >
                      <track kind="captions" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Image
                      src={selectedPhoto.src}
                      alt={selectedPhoto.alt}
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200"
                      style={{
                        maxHeight: '90vh',
                        maxWidth: '90vw',
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = FALLBACK_IMAGE
                        target.alt = 'Gambar tidak dapat dimuat'
                      }}
                    />
                  )}
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
