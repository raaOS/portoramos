'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransitionRouter } from 'next-view-transitions';
import { m, AnimatePresence } from 'motion/react';
import { Grid, Filter, Search as SearchIcon, X, Check, Box } from 'lucide-react';
import { saveProjectsViewMode } from '@/lib/projectsViewMode';
import { useDictionary } from '@/contexts/LanguageContext';

import { Label } from '@/types/labels';

interface ProjectsFinderHeaderProps {
  itemCount: number;
  labels?: Label[];
}

export default function ProjectsFinderHeader({
  itemCount: _itemCount,
  labels = [],
}: ProjectsFinderHeaderProps) {
  const t = useDictionary();
  const router = useRouter();
  // Router khusus untuk transisi visual saat ganti mode grid ↔ 3D canvas
  const vtRouter = useTransitionRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const rawView = searchParams?.get('view');
  const currentView = rawView === '3d' ? '3d' : 'grid';
  const currentTag = searchParams?.get('tag') || '';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Add "All" option to labels
  const allCategories = [{ name: t.projects.allWorks, slug: '' }, ...labels];

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    const frame = requestAnimationFrame(() => {
      setSearchQuery(query);
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [searchParams]);

  // Persist mode terakhir agar tombol "Back to Projects" di halaman detail
  // bisa kembali ke mode yang sama (grid atau 3D canvas).
  useEffect(() => {
    saveProjectsViewMode(currentView);
  }, [currentView]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl+K or "/" opens search modal, Esc closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        e.preventDefault();
        setIsSearchModalOpen(false);
      } else if (e.key === '/' && !isInput && !isSearchModalOpen) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen]);

  // Auto focus input when search modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchModalOpen]);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams?.get('q') || '';
      // Skip push if nothing actually changed (prevents init re-render)
      if (searchQuery === currentQ) return;

      const params = new URLSearchParams(searchParams?.toString());
      if (searchQuery) {
        params.set('q', searchQuery);
      } else {
        params.delete('q');
      }
      setIsNavigating(true);
      router.push(`/projects?${params.toString()}`, { scroll: false });
      setTimeout(() => setIsNavigating(false), 300);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const handleViewChange = (view: 'grid' | '3d') => {
    if (view === currentView) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set('view', view);
    // Pakai vtRouter biar ganti mode grid <-> 3D canvas dapat slide animation
    setIsNavigating(true);
    vtRouter.push(`/projects?${params.toString()}`, { scroll: false });
    setTimeout(() => setIsNavigating(false), 300);
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (tag) {
      params.set('tag', tag);
    } else {
      params.delete('tag');
    }
    setIsFilterOpen(false);
    setIsNavigating(true);
    router.push(`/projects?${params.toString()}`, { scroll: false });
    setTimeout(() => setIsNavigating(false), 300);
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <>
      <div className="relative z-40 mt-8 flex flex-row items-center justify-between gap-4 px-4 py-3 sm:px-8">
        {/* Left Side: Active search badge / Tag badge if filtered */}
        <div className="flex items-center gap-2 overflow-hidden">
          {searchQuery && (
            <div className="flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm backdrop-blur-md dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400">
              <SearchIcon className="h-3 w-3" />
              <span className="max-w-[120px] truncate sm:max-w-[200px]">"{searchQuery}"</span>
              <button
                onClick={handleClear}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-blue-200/60 dark:hover:bg-blue-800/60"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: View Mode & Search Icon Toolbar + Filter Button */}
        <div className="flex items-center justify-end gap-2.5">
          {!isMounted ? (
            <div className="flex items-center gap-1" aria-hidden="true">
              <div className="h-8 w-8 p-1.5" />
              <div className="h-8 w-8 p-1.5" />
              <div className="h-8 w-8 p-1.5" />
            </div>
          ) : (
            <div className="flex items-center rounded-xl border border-gray-200/80 bg-gray-100/70 p-1 shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/70">
              {/* Grid View Mode */}
              <button
                onClick={() => handleViewChange('grid')}
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
                onClick={() => handleViewChange('3d')}
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
                onClick={() => setIsSearchModalOpen(true)}
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
          )}

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[10px] font-black uppercase leading-none tracking-widest shadow-sm transition-all ${
                currentTag
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                  : 'border-gray-200/80 bg-white/90 text-gray-700 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-gray-300 dark:hover:bg-neutral-800'
              }`}
              aria-expanded={isFilterOpen}
              aria-haspopup="listbox"
            >
              <Filter size={12} />{' '}
              {currentTag
                ? allCategories.find((c) => c.slug === currentTag)?.name
                : t.projects.filter}
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
                    onClick={() => handleTagChange(cat.slug)}
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
        </div>
      </div>

      {/* Centered Spotlight Search Modal with Frosted Background Blur */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            {/* Fullscreen Backdrop Blur */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/65"
              onClick={() => setIsSearchModalOpen(false)}
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
                  onClick={() => setIsSearchModalOpen(false)}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsSearchModalOpen(false);
                  }}
                  placeholder={t.projects.searchPlaceholder}
                  className="w-full rounded-xl border border-gray-200/90 bg-gray-100/80 py-3.5 pl-12 pr-12 text-base text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:bg-neutral-800"
                />
                {searchQuery && (
                  <button
                    onClick={handleClear}
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
                            handleTagChange(cat.slug);
                            setIsSearchModalOpen(false);
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
    </>
  );
}
