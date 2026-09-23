'use client';

import React from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useDictionary } from '@/contexts/LanguageContext';
import type { Label } from '@/types/labels';

interface ProjectsSearchModalProps {
  isOpen: boolean;
  searchQuery: string;
  isNavigating: boolean;
  currentTag: string;
  labels: Label[];
  allCategories: Array<{ name: string; slug: string }>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onClear: () => void;
  onSelectTag: (slug: string) => void;
}

export function ProjectsSearchModal({
  isOpen,
  searchQuery,
  isNavigating,
  currentTag,
  labels,
  allCategories,
  searchInputRef,
  onClose,
  onSearchChange,
  onClear,
  onSelectTag,
}: ProjectsSearchModalProps) {
  const t = useDictionary();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          {/* Fullscreen Backdrop Blur */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/65"
            onClick={onClose}
          />

          {/* Centered Modal Window */}
          <m.div
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/50 bg-white/95 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                <SearchIcon size={14} className="text-blue-500" />
                <span>Pencarian Project</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-white"
                aria-label="Tutup pencarian"
              >
                <X size={16} />
              </button>
            </div>

            {/* Large Input Field */}
            <div
              className={`relative flex items-center transition-opacity duration-200 ${
                isNavigating ? 'opacity-70' : 'opacity-100'
              }`}
            >
              <SearchIcon className="absolute left-4 h-5 w-5 text-gray-400 dark:text-neutral-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
                placeholder={t.projects.searchPlaceholder}
                className="w-full rounded-xl border border-gray-200/90 bg-gray-100/80 py-3.5 pl-12 pr-12 text-base text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:bg-neutral-800"
              />
              {searchQuery && (
                <button
                  onClick={onClear}
                  className="absolute right-3.5 flex h-7 w-7 items-center justify-center rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700 dark:hover:bg-neutral-700/60 dark:hover:text-white"
                  aria-label="Hapus teks"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Categories Selection */}
            {labels.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Kategori:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => {
                    const isSelected = currentTag === cat.slug;
                    return (
                      <button
                        key={cat.slug || 'all'}
                        onClick={() => {
                          onSelectTag(cat.slug);
                          onClose();
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/80 dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400 dark:border-neutral-800 dark:text-neutral-500">
              <span>Ketik kata kunci untuk mencari</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-neutral-800 dark:text-neutral-400">
                ESC untuk menutup
              </span>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
