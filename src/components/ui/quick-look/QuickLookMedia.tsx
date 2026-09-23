'use client';

import React, { useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause } from 'lucide-react';
import { QuickLookMediaType } from './types';

interface QuickLookMediaProps {
  type: QuickLookMediaType;
  url: string;
  title: string;
  scale: number;
  showStatus: 'play' | 'pause' | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  handleWheel: (e: React.WheelEvent) => void;
  togglePlay: (e?: React.MouseEvent) => void;
}

export function QuickLookMedia({
  type,
  url,
  title,
  scale,
  showStatus,
  videoRef,
  containerRef,
  handleWheel,
  togglePlay,
}: QuickLookMediaProps) {
  const [isLoading, setIsLoading] = useState(true);
  const rotation = 0;

  return (
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
            className={`max-h-full max-w-full object-contain transition-all duration-300 ${
              scale > 1 ? 'scale-100 cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
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
  );
}
