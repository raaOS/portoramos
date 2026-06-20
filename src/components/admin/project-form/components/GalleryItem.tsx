'use client';
/**
 * Gallery Item — Komponen single item gallery dengan preview dan hapus.
 * @module components/admin/project-form/components/GalleryItem
 */
import React from 'react';
import { X } from 'lucide-react';
import { GalleryItem as GalleryItemType } from '@/types/projects';

interface GalleryItemProps {
  item: GalleryItemType;
  onRemove: () => void;
  onToggleActive: () => void;
}

export default function GalleryItem({ item, onRemove, onToggleActive }: GalleryItemProps) {
  const isVideo = item.kind === 'video';

  return (
    <div
      className={`group relative overflow-hidden rounded border bg-slate-950 transition-all ${
        item.isActive === false ? 'border-slate-200 opacity-40 grayscale' : 'border-slate-800'
      }`}
    >
      <div
        className="relative flex aspect-square cursor-pointer items-center justify-center"
        onClick={onToggleActive}
      >
        {isVideo ? (
          <video src={item.src} className="h-full w-full object-cover" muted />
        ) : (
          <img
            src={item.src}
            alt={item.alt || 'Gallery item'}
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            {item.isActive === false ? 'Hidden' : 'Visible'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1 top-1 z-10 rounded bg-slate-900/80 p-1 text-slate-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
        title="Remove Item"
      >
        <X size={12} />
      </button>

      {item.alt && (
        <div className="border-t border-slate-900 bg-slate-950 p-1.5">
          <p className="truncate font-mono text-[8px] uppercase tracking-wide text-slate-400">
            {item.alt}
          </p>
        </div>
      )}
    </div>
  );
}
