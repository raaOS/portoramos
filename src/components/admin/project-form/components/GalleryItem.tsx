"use client"
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
    <div className={`group relative bg-gray-50 rounded-lg border overflow-hidden transition-all hover:shadow-md ${item.isActive === false ? 'opacity-50 grayscale' : 'border-gray-200'}`}>
      <div className="relative aspect-square bg-black flex items-center justify-center cursor-pointer" onClick={onToggleActive}>
        {isVideo ? (
          <video src={item.src} className="w-full h-full object-cover" muted />
        ) : (
          <img src={item.src} alt={item.alt || 'Gallery item'} className="w-full h-full object-cover" />
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/50 px-2 py-1 rounded">
             {item.isActive === false ? 'Hidden' : 'Visible'}
           </span>
        </div>
      </div>
      
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
      >
        <X size={14} />
      </button>
      
      {item.alt && (
        <div className="p-2 border-t border-gray-100 bg-white">
          <p className="text-[10px] text-gray-500 truncate">{item.alt}</p>
        </div>
      )}
    </div>
  );
}
