'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import OSWindow from '@/app/about/_components/os/Window';
import { useWindowContext } from '@/contexts/WindowContext';

export default function WindowRenderer() {
  const { windows, closeWindow } = useWindowContext();
  const openWindows = windows.filter(w => w.isOpen && !w.isMinimized);

  if (openWindows.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {openWindows.map((window) => (
        <OSWindow
          key={window.id}
          id={window.id}
          title={window.title}
          isOpen={window.isOpen}
          isMinimized={window.isMinimized}
          isMaximized={window.isMaximized}
          zIndex={window.zIndex}
          noPadding={window.noPadding}
          initialPosition={window.initialPosition}
          width={window.width}
          height={window.height}
          onClose={() => closeWindow(window.id)}
        >
          {window.content}
        </OSWindow>
      ))}
    </AnimatePresence>
  );
}
