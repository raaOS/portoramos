'use client';

import React from 'react';
import { Grid, Search as SearchIcon, Box } from 'lucide-react';
import { useDictionary } from '@/contexts/LanguageContext';

interface ViewModeToggleProps {
  currentView: 'grid' | '3d';
  searchQuery: string;
  isSearchModalOpen: boolean;
  onViewChange: (view: 'grid' | '3d') => void;
  onOpenSearchModal: () => void;
}

export function ViewModeToggle({
  currentView,
  searchQuery,
  isSearchModalOpen,
  onViewChange,
  onOpenSearchModal,
}: ViewModeToggleProps) {
  const t = useDictionary();

  return (
    <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-100/70 p-1 shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
      {/* Grid View Mode */}
      <button
        onClick={() => onViewChange('grid')}
        className={`flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg p-1 transition-all duration-200 ${
          currentView === 'grid'
            ? 'scale-105 bg-white text-emerald-600 shadow-sm dark:bg-neutral-800 dark:text-emerald-400'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title={t.projects.gridView}
        aria-label={t.projects.gridView}
        aria-pressed={currentView === 'grid'}
      >
        <Grid size={18} />
      </button>

      {/* 3D Infinite Canvas Mode */}
      <button
        onClick={() => onViewChange('3d')}
        className={`flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg p-1 transition-all duration-200 ${
          currentView === '3d'
            ? 'scale-105 bg-white text-blue-600 shadow-sm dark:bg-neutral-800 dark:text-blue-400'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title={t.projects.view3d}
        aria-label={t.projects.view3d}
        aria-pressed={currentView === '3d'}
      >
        <Box size={18} />
      </button>

      <div className="mx-1 h-4 w-[1px] bg-gray-300/80 dark:bg-neutral-700/80" />

      {/* Search Modal Trigger Button */}
      <button
        onClick={onOpenSearchModal}
        className={`relative flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg p-1 transition-all duration-200 ${
          searchQuery || isSearchModalOpen
            ? 'scale-105 bg-white text-blue-600 shadow-sm dark:bg-neutral-800 dark:text-blue-400'
            : 'text-gray-400 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white'
        }`}
        title="Pencarian Project (Cmd+K atau /)"
        aria-label="Pencarian Project"
        aria-expanded={isSearchModalOpen}
      >
        <SearchIcon size={18} />
        {searchQuery && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-900" />
        )}
      </button>
    </div>
  );
}
