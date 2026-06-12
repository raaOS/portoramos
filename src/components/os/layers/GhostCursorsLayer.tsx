'use client';

import { useGhostCursors, GhostCursor } from '@/hooks/useGhostCursors';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';

export function GhostCursorsLayer({ enabled = true }: { enabled?: boolean }) {
  const cursors = useGhostCursors(enabled);

  if (!enabled || cursors.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] select-none"
      aria-hidden="true"
      style={{ contain: 'strict' }}
    >
      <AnimatePresence mode="popLayout">
        {cursors.map((cursor: GhostCursor) => (
          <GhostCursorItem key={cursor.id} cursor={cursor} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function GhostCursorItem({ cursor }: { cursor: GhostCursor }) {
  const [pos, setPos] = useState({ x: cursor.x, y: cursor.y });
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = () => {
      setPos((prev) => ({
        x: prev.x + (cursor.x - prev.x) * 0.15,
        y: prev.y + (cursor.y - prev.y) * 0.15,
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursor.x, cursor.y]);

  return (
    <motion.div
      style={{ x: pos.x, y: pos.y }}
      className="flex items-center gap-1.5 transition-none will-change-transform"
    >
      {/* Kursor */}
      <div
        className="h-5 w-5"
        style={{
          transform: 'rotate(-45deg) translate(-50%, -50%)',
          transformOrigin: 'top left',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={cursor.color}
          strokeWidth="2.5"
          className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        >
          <path d="M5 5l14 14" strokeLinecap="round" />
          <path d="M5 19l9-9" strokeLinecap="round" />
        </svg>
      </div>
      {/* Label Nama */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white drop-shadow-md backdrop-blur-sm"
        style={{ backgroundColor: cursor.color, boxShadow: `0 0 8px ${cursor.color}80` }}
      >
        {cursor.name}
      </motion.span>
    </motion.div>
  );
}
