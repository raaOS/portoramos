'use client';

import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface LightboxHeaderProps {
  groupName?: string;
  currentIndex: number;
  totalItems: number;
  showActiveFullscreenState: boolean;
  toggleFullscreen: () => void;
  onClose: () => void;
}

export function LightboxHeader({
  groupName,
  currentIndex,
  totalItems,
  showActiveFullscreenState,
  toggleFullscreen,
  onClose,
}: LightboxHeaderProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-4">
      <div className="text-sm font-medium text-white/80 drop-shadow-md">
        {groupName && <span className="mr-2 opacity-70">{groupName} &bull;</span>}
        {currentIndex + 1} / {totalItems}
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
  );
}
