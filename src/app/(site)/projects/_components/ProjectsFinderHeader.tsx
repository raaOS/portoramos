'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Grid, List, Filter, Search as SearchIcon, X, Check, Box } from 'lucide-react';

import { Label } from '@/types/labels';

interface ProjectsFinderHeaderProps {
    itemCount: number;
    labels?: Label[];
}

export default function ProjectsFinderHeader({ itemCount, labels = [] }: ProjectsFinderHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // FIX: Remove useTransition - not needed for simple router.push
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const currentView = searchParams?.get('view') || 'grid';
    const currentTag = searchParams?.get('tag') || '';
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Add "All" option to labels
    const allCategories = [
        { name: 'Semua Karya', slug: '' },
        ...labels
    ];

    useEffect(() => {
        const query = searchParams?.get('q') || '';
        const frame = requestAnimationFrame(() => {
            setSearchQuery(query);
            setIsMounted(true);
        });
        return () => cancelAnimationFrame(frame);
    }, [searchParams]);

    // Close filter when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            // FIX: Direct router.push without startTransition
            setIsNavigating(true);
            router.push(`/projects?${params.toString()}`, { scroll: false });
            // Reset navigating state after a short delay
            setTimeout(() => setIsNavigating(false), 300);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, router, searchParams]);

    const handleViewChange = (view: 'grid' | 'list' | '3d') => {
        if (view === currentView) return;
        const params = new URLSearchParams(searchParams?.toString());
        params.set('view', view);
        // FIX: Direct router.push without startTransition
        setIsNavigating(true);
        router.push(`/projects?${params.toString()}`, { scroll: false });
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
        // FIX: Direct router.push without startTransition
        setIsNavigating(true);
        router.push(`/projects?${params.toString()}`, { scroll: false });
        setTimeout(() => setIsNavigating(false), 300);
    };

    const handleClear = () => {
        setSearchQuery('');
    };

    return (
        <div className="px-4 sm:px-8 py-4 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-50">
            {/* Title */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight whitespace-nowrap">Koleksi Project</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{itemCount} Items</p>
                </div>
            </div>

            {/* Search Input Integrated into Header */}
            <div className={`relative w-full max-w-md mx-auto sm:mx-0 order-3 sm:order-2 transition-opacity duration-200 ${isNavigating ? 'opacity-70' : 'opacity-100'}`}>
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari project, klien, atau kategori..."
                    className="w-full pl-10 pr-9 py-2 bg-gray-200/50 dark:bg-neutral-800/50 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
                {isMounted && searchQuery && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-red-500" />
                    </button>
                )}
            </div>

            {/* View Mode & Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-2 sm:order-3">
                {!isMounted ? (
                    <div className="flex items-center gap-1" aria-hidden="true">
                        <div className="p-1.5 w-7 h-7" />
                        <div className="p-1.5 w-7 h-7" />
                        <div className="p-1.5 w-7 h-7" />
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handleViewChange('grid')}
                            className={`p-1 transition-all duration-200 ${currentView === 'grid' ? 'text-emerald-500 scale-110 drop-shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Tampilan Grid"
                            aria-label="Grid view"
                            aria-pressed={currentView === 'grid'}
                        >
                            <Grid size={18} />
                        </button>
                        <button 
                            onClick={() => handleViewChange('list')}
                            className={`p-1 transition-all duration-200 ${currentView === 'list' ? 'text-amber-500 scale-110 drop-shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Tampilan List"
                            aria-label="List view"
                            aria-pressed={currentView === 'list'}
                        >
                            <List size={18} />
                        </button>
                        <button 
                            onClick={() => handleViewChange('3d')}
                            className={`p-1 transition-all duration-200 ${currentView === '3d' ? 'text-blue-500 scale-110 drop-shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Tampilan 3D"
                            aria-label="3D view"
                            aria-pressed={currentView === '3d'}
                        >
                            <Box size={18} />
                        </button>
                    </div>
                )}
                
                {/* Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-md text-[10px] font-black transition-all shadow-sm uppercase tracking-widest leading-none ${currentTag ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                        aria-expanded={isFilterOpen}
                        aria-haspopup="listbox"
                    >
                        <Filter size={12} /> {currentTag ? allCategories.find(c => c.slug === currentTag)?.name : 'Filter'}
                    </button>

                    {isFilterOpen && (
                        <div 
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]"
                            role="listbox"
                            aria-label="Filter categories"
                        >
                            {allCategories.map((cat) => (
                                <button
                                    key={cat.slug}
                                    onClick={() => handleTagChange(cat.slug)}
                                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${currentTag === cat.slug ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
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
    );
}

