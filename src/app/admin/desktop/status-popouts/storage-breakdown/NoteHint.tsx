'use client';

import React, { useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface NoteHintProps {
  text: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function NoteHint({ text, isOpen, onToggle, onClose }: NoteHintProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => !isOpen && onToggle()}
      onMouseLeave={() => isOpen && onToggle()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`inline-flex items-center justify-center transition-colors ${
          isOpen ? 'text-blue-600' : 'text-zinc-400 hover:text-blue-600'
        }`}
        title="Penjelasan kategori"
        aria-label="Penjelasan kategori"
        aria-expanded={isOpen}
      >
        <Info className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 max-w-[min(15rem,calc(100vw-2rem))] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] leading-snug text-zinc-600 shadow-lg"
          style={{ width: 'max-content' }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
