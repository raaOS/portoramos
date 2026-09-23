'use client';

import { useGhostCursors, GhostCursor } from '@/hooks/useGhostCursors';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';

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
  const elRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: cursor.x, y: cursor.y });
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Set initial position immediately so cursor appears at the right spot
    if (elRef.current) {
      elRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
    }

    const animate = () => {
      const p = posRef.current;
      p.x += (cursor.x - p.x) * 0.15;
      p.y += (cursor.y - p.y) * 0.15;

      // Write directly to the DOM to bypass React reconciliation at ~60fps.
      if (elRef.current) {
        elRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursor.x, cursor.y]);

  return (
    <div
      ref={elRef}
      className="absolute left-0 top-0 pointer-events-none select-none transition-none will-change-transform"
    >
      <div className="relative">
        {/* Real Mouse Cursor Arrow Icon - No Shadow */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
            fill={cursor.color}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Label Nama Badge - Flat / No Shadow */}
        <motion.span
          initial={{ opacity: 0, scale: 0.8, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute left-3.5 top-3.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold text-white select-none"
          style={{
            backgroundColor: cursor.color,
          }}
        >
          {cursor.name}
        </motion.span>
      </div>
    </div>
  );
}
