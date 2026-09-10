import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, Maximize2, X } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import type { GalleryItem } from '@/types/projects';
import Media from '@/components/shared/Media';
import { getProxiedUrl } from '@/lib/utils';

interface WindowImagePreviewProps {
  items: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
  groupName?: string;
  isWindowMaximized: boolean;
  onToggleWindowMaximize: () => void;
}

export default function WindowImagePreview({
  items,
  initialIndex = 0,
  onClose,
  groupName,
  isWindowMaximized,
  onToggleWindowMaximize,
}: WindowImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const validItems = items.filter((item) => item.isActive !== false);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === validItems.length - 1 ? 0 : prev + 1));
  }, [validItems.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? validItems.length - 1 : prev - 1));
  }, [validItems.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onClose, handleNext, handlePrev]);

  if (validItems.length === 0) return null;

  const currentItem = validItems[currentIndex];

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-30 flex select-none flex-col overflow-hidden bg-black/95"
      >
        {/* Header / Top Bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="text-xs font-medium text-white/80 drop-shadow-md sm:text-sm">
            {groupName && <span className="mr-2 opacity-70">{groupName} &bull;</span>}
            {currentIndex + 1} / {validItems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleWindowMaximize}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white active:scale-90"
              aria-label={isWindowMaximized ? 'Restore window size' : 'Maximize window'}
            >
              {isWindowMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-black/20 p-2 text-white/70 transition-all hover:bg-black/40 hover:text-white active:scale-90"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 p-4 sm:p-12">
          <m.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex min-h-0 w-full flex-grow items-center justify-center px-2"
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
          </m.div>

          {/* Thumbnails Ribbon */}
          {validItems.length > 1 && (
            <div className="flex w-full justify-center pb-2">
              <div className="no-scrollbar pointer-events-auto flex max-w-full items-center justify-start gap-2 overflow-x-auto scroll-smooth p-1">
                {validItems.map((item, index) => (
                  <button
                    key={`thumb-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={`relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-none border transition-all duration-300 sm:h-14 sm:w-14 ${
                      index === currentIndex
                        ? 'z-10 scale-105 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
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
                          <div className="flex h-4 w-4 items-center justify-center">
                            <div className="ml-0.5 h-0 w-0 border-b-[4px] border-l-[7px] border-t-[4px] border-b-transparent border-l-white border-t-transparent" />
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
              className="group absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white active:scale-90 sm:block"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="group absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2.5 text-white/50 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white active:scale-90 sm:block"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile invisible touch zones for navigation */}
            <div
              className="absolute inset-y-0 left-0 z-0 w-1/4 cursor-w-resize sm:hidden"
              onClick={handlePrev}
            />
            <div
              className="absolute inset-y-0 right-0 z-0 w-1/4 cursor-e-resize sm:hidden"
              onClick={handleNext}
            />
          </>
        )}
      </m.div>
    </AnimatePresence>
  );
}
