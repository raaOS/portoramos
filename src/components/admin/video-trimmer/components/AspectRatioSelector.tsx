'use client';

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { getAspectOptions } from '../utils/videoTrimmerUtils';

interface AspectRatioSelectorProps {
  aspect: number | undefined;
  naturalAspect: number | undefined;
  onSelectAspect: (aspect: number | undefined) => void;
}

export function AspectRatioSelector({
  aspect,
  naturalAspect,
  onSelectAspect,
}: AspectRatioSelectorProps) {
  const aspectOptions = getAspectOptions(naturalAspect);

  return (
    <div className="absolute right-4 top-4 z-10 flex flex-col gap-2 rounded bg-white p-2 text-xs">
      <span className="flex items-center gap-1 font-bold uppercase text-gray-500">
        <Maximize2 size={12} /> Ratio
      </span>
      <div className="flex flex-col gap-1">
        {aspectOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelectAspect(opt.value)}
            className={`rounded border px-2 py-1 transition-colors ${
              aspect === opt.value && (opt.value !== undefined || aspect === undefined)
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
