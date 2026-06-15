'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const popoutTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.9,
};

const popoutInitial = { opacity: 0, y: -8, scale: 0.96, filter: 'blur(8px)' };
const popoutAnimate = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' };
const popoutExit = { opacity: 0, y: -6, scale: 0.97, filter: 'blur(6px)' };

interface PopoutShellProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  width?: number;
}

export default function PopoutShell({
  isOpen,
  onClose,
  anchorRef,
  children,
  width = 280,
}: PopoutShellProps) {
  const popoutRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoutRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    // Defer to avoid catching the same click that opened it
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose, anchorRef]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Position relative to anchor.
  const [pos, setPos] = React.useState<{
    top: number;
    left: number;
    width: number;
    transformOrigin: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const margin = 8;
      const maxAvailable = Math.max(160, window.innerWidth - margin * 2);
      const effectiveWidth = Math.min(width, maxAvailable);

      const anchorCenter = rect.left + rect.width / 2;
      const desiredLeft = anchorCenter - effectiveWidth / 2;
      const maxLeft = window.innerWidth - effectiveWidth - margin;
      const left = Math.min(Math.max(margin, desiredLeft), Math.max(margin, maxLeft));
      const top = rect.bottom + margin;

      const popoutCenter = left + effectiveWidth / 2;
      const offset = anchorCenter - popoutCenter;
      let originX: string;
      if (offset > effectiveWidth / 4) originX = 'right';
      else if (offset < -effectiveWidth / 4) originX = 'left';
      else originX = 'center';

      setPos({ top, left, width: effectiveWidth, transformOrigin: `top ${originX}` });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, anchorRef, width]);

  return (
    <AnimatePresence>
      {isOpen && pos && (
        <motion.div
          ref={popoutRef}
          initial={popoutInitial}
          animate={popoutAnimate}
          exit={popoutExit}
          transition={popoutTransition}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            maxHeight: `calc(100dvh - ${pos.top + 8}px)`,
            zIndex: 10000,
            transformOrigin: pos.transformOrigin,
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
          className="rounded-xl border border-zinc-200 bg-white/75 text-zinc-700 backdrop-blur-2xl"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
