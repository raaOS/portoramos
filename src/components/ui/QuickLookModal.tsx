import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Play, Pause, X } from 'lucide-react';

interface QuickLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'image' | 'video' | 'pdf' | 'text' | 'project';
  url: string;
  metadata?: string;
  onGoToDetail?: () => void;
  // New Props for Gallery
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const rotation = 0;
  const isFullscreen = true;
  const videoRef = useRef<HTMLVideoElement>(null);

  const [showStatus, setShowStatus] = useState<'play' | 'pause' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (type === 'video') return;
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.75, scale + delta), 4);
    setScale(newScale);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setShowStatus('play');
      } else {
        videoRef.current.pause();
        setShowStatus('pause');
      }
      setTimeout(() => setShowStatus(null), 800);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.code === 'Space') {
        e.preventDefault();
        if (type === 'video') togglePlay();
        else onClose();
      }
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, type, hasNext, hasPrev, onNext, onPrev]);

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
        <div
          ref={containerRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden p-0"
          onWheel={handleWheel}
        >
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}

          {/* Play/Pause Center Feedback */}
          <AnimatePresence>
            {showStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="pointer-events-none absolute inset-0 z-[70] flex items-center justify-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md">
                  {showStatus === 'play' ? (
                    <Play size={40} fill="currentColor" />
                  ) : (
                    <Pause size={40} fill="currentColor" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Main Media */}
          <motion.div
            className="relative z-10 flex h-full w-full items-center justify-center"
            animate={{ scale, rotate: rotation }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={scale > 1}
            dragConstraints={containerRef}
            dragElastic={0.1}
          >
            {(type === 'image' || type === 'project') && (
              <img
                src={url}
                alt={title}
                className={`max-h-full max-w-full object-contain transition-all duration-300 ${scale > 1 ? 'scale-100 cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                onLoad={() => setIsLoading(false)}
                draggable={false}
              />
            )}

            {type === 'video' && (
              <div
                className="flex h-full w-full cursor-pointer items-center justify-center"
                onClick={togglePlay}
              >
                <video
                  ref={videoRef}
                  src={url}
                  controls={false}
                  autoPlay
                  loop
                  className="max-h-full max-w-full"
                  onLoadedData={() => setIsLoading(false)}
                />
              </div>
            )}
          </motion.div>
        </div>

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
