'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Users, Check } from 'lucide-react';
import { useOSOverlays } from '../../context/OSSystemContext';

interface MenuBarViewMenuProps {
  viewLabel: string;
  showGhostCursorsLabel: string;
}

export function MenuBarViewMenu({
  viewLabel,
  showGhostCursorsLabel,
}: MenuBarViewMenuProps) {
  const { showGhostCursors, toggleGhostCursors } = useOSOverlays();
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={viewMenuRef}
      className="relative"
      onClick={() => setViewMenuOpen(!viewMenuOpen)}
    >
      <div className="flex cursor-default items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
        {viewLabel}
        <ChevronDown size={10} aria-hidden="true" />
      </div>
      {viewMenuOpen && (
        <div className="absolute left-0 top-full z-[1000] mt-1 min-w-[140px] rounded border border-gray-200 bg-white py-1 shadow-lg">
          <div
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-black/5"
            onClick={(e) => {
              e.stopPropagation();
              toggleGhostCursors();
            }}
          >
            <Users
              size={14}
              className={`flex-shrink-0 ${
                showGhostCursors ? 'text-emerald-500' : 'text-gray-400'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">{showGhostCursorsLabel}</span>
            {showGhostCursors && (
              <Check size={12} className="ml-auto text-emerald-500" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
