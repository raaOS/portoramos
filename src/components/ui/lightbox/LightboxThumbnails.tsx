'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { GalleryItem } from '@/types/projects';
import { getProxiedUrl } from '@/lib/utils';

interface LightboxThumbnailsProps {
  validItems: GalleryItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export function LightboxThumbnails({
  validItems,
  currentIndex,
  onSelectIndex,
}: LightboxThumbnailsProps) {
  if (validItems.length <= 1) return null;

  return (
    <div className="flex w-full justify-center pb-4 sm:pb-0">
      <div className="no-scrollbar pointer-events-auto flex max-w-full items-center justify-start gap-3 overflow-x-auto scroll-smooth p-2">
        {validItems.map((item, index) => (
          <button
            key={`thumb-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIndex(index);
            }}
            className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-none border-2 transition-all duration-300 sm:h-16 sm:w-16 ${
              index === currentIndex
                ? 'z-10 scale-105 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                : 'border-white/10 opacity-40 hover:scale-105 hover:opacity-100'
            }`}
          >
            {item.kind === 'video' ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                {item.poster ? (
                  <img
                    src={getProxiedUrl(item.poster)}
                    alt=""
                    className="h-full w-full rounded-none object-cover"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/50">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="ml-1 h-0 w-0 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-white border-t-transparent" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={getProxiedUrl(item.src)}
                alt=""
                className="h-full w-full rounded-none object-cover"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
