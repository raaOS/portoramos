'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { QuickLookModalProps } from './quick-look/types';
import { useQuickLookShortcuts } from './quick-look/useQuickLookShortcuts';
import { QuickLookMedia } from './quick-look/QuickLookMedia';

export type { QuickLookModalProps, QuickLookMediaType } from './quick-look/types';

export default function QuickLookModal({
  isOpen,
  onClose,
  title,
  type,
  url,
  metadata,
  onGoToDetail,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: QuickLookModalProps) {
  const mediaKey = useMemo(() => `${type}:${url}`, [type, url]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <QuickLookModalBody
        key={mediaKey}
        onClose={onClose}
        title={title}
        type={type}
        url={url}
        metadata={metadata}
        onGoToDetail={onGoToDetail}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={onNext}
        onPrev={onPrev}
      />
    </AnimatePresence>
  );
}

function QuickLookModalBody({
  onClose,
  title,
  type,
  url,
  metadata,
  onGoToDetail,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: Omit<QuickLookModalProps, 'isOpen'>) {
  const isFullscreen = true;
  const {
    scale,
    showStatus,
    videoRef,
    containerRef,
    handleWheel,
    togglePlay,
  } = useQuickLookShortcuts({
    type,
    onClose,
    hasNext,
    hasPrev,
    onNext,
    onPrev,
  });

  return (
    <div
      role="dialog"
      aria-label={title}
      aria-modal="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 ${isFullscreen ? 'sm:p-0' : ''}`}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full ${isFullscreen ? 'h-full max-w-full' : 'max-h-[90vh] max-w-5xl'} pointer-events-auto flex flex-col overflow-hidden rounded-none border border-white/5 bg-black shadow-2xl sm:rounded-2xl`}
      >
        {/* Toolbar Overhead */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col">
              <span className="max-w-[200px] truncate text-sm font-bold tracking-tight text-white">
                {title}
              </span>
              {metadata && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {metadata}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoToDetail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGoToDetail();
                }}
                className="h-9 rounded-full border border-white/10 bg-white/10 px-4 text-xs font-semibold tracking-wide text-white transition-all hover:bg-white/20 active:scale-95"
              >
                Open
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <QuickLookMedia
          type={type}
          url={url}
          title={title}
          scale={scale}
          showStatus={showStatus}
          videoRef={videoRef}
          containerRef={containerRef}
          handleWheel={handleWheel}
          togglePlay={togglePlay}
        />

        {/* Navigation Buttons */}
        {hasPrev && onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="group/nav absolute left-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
          >
            <ChevronLeft
              size={24}
              className="transition-transform group-hover/nav:-translate-x-0.5"
            />
          </button>
        )}
        {hasNext && onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="group/nav absolute right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
          >
            <ChevronRight
              size={24}
              className="transition-transform group-hover/nav:translate-x-0.5"
            />
          </button>
        )}

        {/* Minimal Gallery Tip */}
        {(hasNext || hasPrev) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 z-50 flex justify-center opacity-0 transition-opacity hover:opacity-100">
            <div className="rounded-full border border-white/5 bg-black/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 backdrop-blur-md">
              Swipe or Arrows to Navigate
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
