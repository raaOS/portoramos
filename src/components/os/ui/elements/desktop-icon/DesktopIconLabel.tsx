'use client';

import React from 'react';

interface DesktopIconLabelProps {
  label: string;
  isSelected?: boolean;
}

export function DesktopIconLabel({ label, isSelected = false }: DesktopIconLabelProps) {
  return (
    <div className="relative mt-1 rounded-[4px] px-2 py-0.5 transition-transform duration-200 group-active:scale-95">
      {/* Background for contrast */}
      <div
        className={`absolute inset-0 rounded-[4px] transition-colors transition-opacity duration-200 ${
          isSelected
            ? 'bg-[rgba(0,122,255,0.85)] opacity-100'
            : 'bg-black/30 opacity-100 backdrop-blur-[2px]'
        }`}
      />

      {/* Label Text */}
      <span className="relative block max-w-[80px] select-none truncate text-center text-[11px] font-medium leading-tight text-white transition-colors duration-200">
        {label}
      </span>
    </div>
  );
}
