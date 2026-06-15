'use client';

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import type { GalleryItem } from '@/types/projects';
import Media from '@/components/shared/Media';
import { getProxiedUrl } from '@/lib/utils';
import { DesktopWindowContext } from '@/components/os/context/DesktopWindowContext';

interface LightboxGalleryProps {
  items: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
  groupName?: string;
  windowId?: string; // Optional virtual window ID to maximize instead of browser fullscreen
}

export default function LightboxGallery({
  items,
  initialIndex = 0,
  onClose,
  groupName,
  windowId,
}: LightboxGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const validItems = items.filter((item) => item.isActive !== false);

  // Touch swipe tracking for mobile navigation
  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // minimum px to register a swipe

  const desktopContext = useContext(DesktopWindowContext);

  const isWindowMaximized =
    desktopContext && windowId
      ? desktopContext.windows.find((w) => w.id === windowId)?.isMaximized || false
      : false;

  const showActiveFullscreenState = windowId && desktopContext ? isWindowMaximized : isFullscreen;

  const toggleFullscreen = useCallback(() => {
    if (windowId && desktopContext) {
      desktopContext.maximizeWindow(windowId);
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, [windowId, desktopContext]);

  useEffect(() => {
    if (windowId && desktopContext) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [windowId, desktopContext]);

  // Auto exit fullscreen on unmount
  useEffect(() => {
    return () => {
      if (windowId && desktopContext) return;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [windowId, desktopContext]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === validItems.length - 1 ? 0 : prev + 1));
  }, [validItems.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validItems.length - 1 : prev - 1));
  }, [validItems.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    },
    [onClose, handleNext, handlePrev]
  );

  useEffect(() => {
    if (!windowId || !desktopContext) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handleKeyDown, windowId, desktopContext]);

  if (validItems.length === 0) return null;

  const currentItem = validItems[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label={groupName ? `Gallery: ${groupName}` : 'Image gallery'}
        aria-modal="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current !== null) {
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) >= SWIPE_THRESHOLD) {
              if (diff > 0) handlePrev();
              else handleNext();
            }
            touchStartX.current = null;
          }
        }}
        className={
          windowId && desktopContext
            ? 'absolute inset-0 z-30 flex items-center justify-center bg-black/95 backdrop-blur-sm'
            : 'fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-sm'
        }
      >
        {/* Header / Top Bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="text-sm font-medium text-white/80 drop-shadow-md">
            {groupName && <span className="mr-2 opacity-70">{groupName} &bull;</span>}
            {currentIndex + 1} / {validItems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white"
              aria-label={showActiveFullscreenState ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {showActiveFullscreenState ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white"
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 p-4 sm:p-20">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex min-h-0 w-full flex-grow items-center justify-center px-3"
          >
            {currentItem.kind === 'video' ? (
              <Media
                kind="video"
                src={currentItem.src}
                poster={currentItem.poster}
                className="max-h-full max-w-full rounded-none object-contain shadow-2xl"
                autoplay={true}
                muted={false}
                loop={true}
                playsInline={true}
                controls={true}
              />
            ) : (
              <img
                src={getProxiedUrl(currentItem.src)}
                alt={currentItem.alt || `Gallery Image ${currentIndex + 1}`}
                className="max-h-full max-w-full select-none rounded-none object-contain shadow-2xl"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </motion.div>

          {/* Thumbnails Ribbon */}
          {validItems.length > 1 && (
            <div className="flex w-full justify-center pb-4 sm:pb-0">
              <div className="no-scrollbar pointer-events-auto flex max-w-full items-center justify-start gap-3 overflow-x-auto scroll-smooth p-2">
                {validItems.map((item, index) => (
                  <button
                    key={`thumb-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-none border-2 transition-all duration-300 sm:h-16 sm:w-16 ${
                      index === currentIndex
                        ? 'z-10 scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'border-white/10 opacity-40 hover:scale-105 hover:opacity-100'
                    }`}
                  >
                    {item.kind === 'video' ? (
                      <div className="flex h-full w-full items-center justify-center bg-gray-900">
                        {item.poster ? (
                          <img
                            src={getProxiedUrl(item.poster)}
                            alt=""
                            className="h-full w-full rounded-none object-cover"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/50">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <div className="ml-1 h-0 w-0 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-white border-t-transparent" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getProxiedUrl(item.src)}
                        alt=""
                        className="h-full w-full rounded-none object-cover"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {validItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="group absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-3 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white sm:block"
            >
              <ChevronLeft className="h-8 w-8 transition-transform group-hover:-translate-x-1" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="group absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-3 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white sm:block"
            >
              <ChevronRight className="h-8 w-8 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Mobile invisible touch zones for navigation */}
            <div className="absolute inset-y-0 left-0 z-0 w-1/3 sm:hidden" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 z-0 w-1/3 sm:hidden" onClick={handleNext} />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
