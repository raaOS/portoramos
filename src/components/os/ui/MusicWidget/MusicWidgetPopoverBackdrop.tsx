'use client';

import React from 'react';
import { motion } from 'motion/react';

interface MusicWidgetPopoverBackdropProps {
  activeArtwork: string | null;
  activeArtworkFailed: boolean;
  onArtworkError: () => void;
}

export function MusicWidgetPopoverBackdrop({
  activeArtwork,
  activeArtworkFailed,
  onArtworkError,
}: MusicWidgetPopoverBackdropProps) {
  return (
    <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {activeArtwork && !activeArtworkFailed && (
        <img
          src={activeArtwork}
          alt=""
          onError={onArtworkError}
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-15 blur-3xl dark:opacity-25"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-950/50" />
    </motion.div>
  );
}
