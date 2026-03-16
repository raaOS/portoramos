'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Grid, List, Filter, Search as SearchIcon, X, Check } from 'lucide-react';

interface ProjectsFinderHeaderProps {
    itemCount: number;
}

const CATEGORIES = [
    { label: 'Semua Karya', value: '' },
    { label: 'Video & Motion', value: 'video' },
    { label: 'Image & Artwork', value: 'image' },
    { label: 'Commercial', value: 'commercial' },
    { label: 'Visual Art', value: 'visual_art' },
];

export default function ProjectsFinderHeader({ itemCount }: ProjectsFinderHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
    const currentView = searchParams?.get('view') || 'grid';
    const currentTag = searchParams?.get('tag') || '';
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

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
            startTransition(() => {
                router.push(`/projects?${params.toString()}`, { scroll: false });
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, router, searchParams]);

    const handleViewChange = (view: 'grid' | 'list') => {
        if (view === currentView) return;
        const params = new URLSearchParams(searchParams?.toString());
        params.set('view', view);
        startTransition(() => {
            router.push(`/projects?${params.toString()}`, { scroll: false });
        });
    };

    const handleTagChange = (tag: string) => {
        const params = new URLSearchParams(searchParams?.toString());
        if (tag) {
            params.set('tag', tag);
        } else {
            params.delete('tag');
        }
        setIsFilterOpen(false);
        startTransition(() => {
            router.push(`/projects?${params.toString()}`, { scroll: false });
        });
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
            <div className={`relative w-full max-w-md mx-auto sm:mx-0 order-3 sm:order-2 transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari project, klien, atau kategori..."
                    className="w-full pl-10 pr-9 py-2 bg-gray-200/50 dark:bg-neutral-800/50 border border-gray-300 dark:border-neutral-700 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
                {searchQuery && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                )}
            </div>

            {/* View Mode & Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-2 sm:order-3">
                <div className="flex items-center bg-gray-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-gray-200/80 dark:border-neutral-700/80">
                    <button 
                        onClick={() => handleViewChange('grid')}
                        className={`p-1.5 rounded-md transition-all duration-200 ${currentView === 'grid' ? 'bg-white dark:bg-neutral-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        title="Tampilan Grid"
                    >
                        <Grid size={14} />
                    </button>
                    <button 
                        onClick={() => handleViewChange('list')}
                        className={`p-1.5 rounded-md transition-all duration-200 ${currentView === 'list' ? 'bg-white dark:bg-neutral-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        title="Tampilan List"
                    >
                        <List size={14} />
                    </button>
                </div>
                
                {/* Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-md text-[10px] font-black transition-all shadow-sm uppercase tracking-widest leading-none ${currentTag ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                    >
                        <Filter size={12} /> {currentTag ? CATEGORIES.find(c => c.value === currentTag)?.label : 'Filter'}
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => handleTagChange(cat.value)}
                                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${currentTag === cat.value ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {cat.label}
                                    {currentTag === cat.value && <Check size={12} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
