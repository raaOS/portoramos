'use client';
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
      className={`group relative overflow-hidden rounded-lg border bg-gray-50 transition-all hover:shadow-md ${item.isActive === false ? 'opacity-50 grayscale' : 'border-gray-200'}`}
    >
      <div
        className="relative flex aspect-square cursor-pointer items-center justify-center bg-black"
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

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
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
        className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        <X size={14} />
      </button>

      {item.alt && (
        <div className="border-t border-gray-100 bg-white p-2">
          <p className="truncate text-[10px] text-gray-500">{item.alt}</p>
        </div>
      )}
    </div>
  );
}
