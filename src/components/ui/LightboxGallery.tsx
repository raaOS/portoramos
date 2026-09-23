'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryItem } from '@/types/projects';
import Media from '@/components/shared/Media';
import { getProxiedUrl } from '@/lib/utils';
import {
  useLightboxGestures,
  LightboxHeader,
  LightboxThumbnails,
} from './lightbox';

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
  const validItems = items.filter((item) => item.isActive !== false);

  const {
    currentIndex,
    setCurrentIndex,
    showActiveFullscreenState,
    desktopContext,
    toggleFullscreen,
    handleNext,
    handlePrev,
    handleTouchStart,
    handleTouchEnd,
  } = useLightboxGestures({
    validItems,
    initialIndex,
    onClose,
    windowId,
  });

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={
          windowId && desktopContext
            ? 'absolute inset-0 z-30 flex items-center justify-center bg-black/95 backdrop-blur-sm'
            : 'fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-sm'
        }
      >
        {/* Header / Top Bar */}
        <LightboxHeader
          groupName={groupName}
          currentIndex={currentIndex}
          totalItems={validItems.length}
          showActiveFullscreenState={showActiveFullscreenState}
          toggleFullscreen={toggleFullscreen}
          onClose={onClose}
        />

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
          <LightboxThumbnails
            validItems={validItems}
            currentIndex={currentIndex}
            onSelectIndex={setCurrentIndex}
          />
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
