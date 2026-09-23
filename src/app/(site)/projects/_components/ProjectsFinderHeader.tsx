'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransitionRouter } from 'next-view-transitions';
import { Search as SearchIcon, X } from 'lucide-react';
import { saveProjectsViewMode } from '@/lib/projectsViewMode';
import { useDictionary } from '@/contexts/LanguageContext';
import type { Label } from '@/types/labels';
import { ViewModeToggle } from './ViewModeToggle';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';
import { ProjectsSearchModal } from './ProjectsSearchModal';

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
            <ViewModeToggle
              currentView={currentView}
              searchQuery={searchQuery}
              isSearchModalOpen={isSearchModalOpen}
              onViewChange={handleViewChange}
              onOpenSearchModal={() => setIsSearchModalOpen(true)}
            />
          )}

          {/* Filter Dropdown */}
          <CategoryFilterDropdown
            isFilterOpen={isFilterOpen}
            currentTag={currentTag}
            allCategories={allCategories}
            filterRef={filterRef}
            onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
            onSelectTag={handleTagChange}
          />
        </div>
      </div>

      {/* Centered Spotlight Search Modal with Frosted Background Blur */}
      <ProjectsSearchModal
        isOpen={isSearchModalOpen}
        searchQuery={searchQuery}
        isNavigating={isNavigating}
        currentTag={currentTag}
        labels={labels}
        allCategories={allCategories}
        searchInputRef={searchInputRef}
        onClose={() => setIsSearchModalOpen(false)}
        onSearchChange={setSearchQuery}
        onClear={handleClear}
        onSelectTag={handleTagChange}
      />
    </>
  );
}
