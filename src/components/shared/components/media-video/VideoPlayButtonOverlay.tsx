'use client';

import React from 'react';

interface VideoPlayButtonOverlayProps {
  shouldLoad: boolean;
  onManualPlay: () => void;
}

export function VideoPlayButtonOverlay({
  shouldLoad,
  onManualPlay,
}: VideoPlayButtonOverlayProps) {
  return (
    <div
      className="group absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/40 transition-colors hover:bg-black/50"
      onClick={(e) => {
        e.stopPropagation();
        onManualPlay();
      }}
    >
      <div
        className={`rounded-full bg-white/95 shadow-2xl transition-transform ${
          shouldLoad ? 'p-5 group-hover:scale-110' : 'scale-110 p-6'
        }`}
      >
        <svg
          className={`${shouldLoad ? 'h-12 w-12' : 'h-16 w-16'} text-black`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
