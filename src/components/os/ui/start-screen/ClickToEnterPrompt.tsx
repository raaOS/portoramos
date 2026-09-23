'use client';

import React from 'react';
import { m } from 'motion/react';

export function ClickToEnterPrompt() {
  return (
    <m.div
      className="absolute inset-0 z-[10003] flex items-end justify-center pb-14 sm:pb-18 pointer-events-none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <m.p className="whitespace-nowrap text-xs sm:text-sm font-medium uppercase tracking-[0.45em] text-white/45 select-none animate-pulse">
        Click to Enter
      </m.p>
    </m.div>
  );
}
