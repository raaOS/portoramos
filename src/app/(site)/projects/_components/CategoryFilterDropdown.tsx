'use client';

import React from 'react';
import { Filter, Check } from 'lucide-react';
import { useDictionary } from '@/contexts/LanguageContext';

interface CategoryFilterDropdownProps {
  isFilterOpen: boolean;
  currentTag: string;
  allCategories: Array<{ name: string; slug: string }>;
  filterRef: React.RefObject<HTMLDivElement | null>;
  onToggleFilter: () => void;
  onSelectTag: (slug: string) => void;
}

export function CategoryFilterDropdown({
  isFilterOpen,
  currentTag,
  allCategories,
  filterRef,
  onToggleFilter,
  onSelectTag,
}: CategoryFilterDropdownProps) {
  const t = useDictionary();

  return (
    <div className="relative" ref={filterRef}>
      <button
        onClick={onToggleFilter}
        className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[10px] font-black uppercase leading-none tracking-widest shadow-sm transition-all ${
          currentTag
            ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
            : 'border-gray-200/80 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-gray-300 dark:hover:bg-neutral-800'
        }`}
        aria-expanded={isFilterOpen}
        aria-haspopup="listbox"
      >
        <Filter size={12} />{' '}
        {currentTag ? allCategories.find((c) => c.slug === currentTag)?.name : t.projects.filter}
      </button>

      {isFilterOpen && (
        <div
          className="animate-in fade-in zoom-in absolute right-0 z-[100] mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl duration-200 dark:border-neutral-800 dark:bg-neutral-900"
          role="listbox"
          aria-label="Filter categories"
        >
          {allCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onSelectTag(cat.slug)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                currentTag === cat.slug
                  ? 'font-bold text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
              role="option"
              aria-selected={currentTag === cat.slug}
            >
              {cat.name}
              {currentTag === cat.slug && <Check size={12} className="text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
