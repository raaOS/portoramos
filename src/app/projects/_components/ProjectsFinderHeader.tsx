'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Grid, List, Filter, Search as SearchIcon, X } from 'lucide-react';

interface ProjectsFinderHeaderProps {
    itemCount: number;
}

export default function ProjectsFinderHeader({ itemCount }: ProjectsFinderHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');

    // Debounce search update to URL
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams?.toString());
            if (searchQuery) {
                params.set('q', searchQuery);
            } else {
                params.delete('q');
            }
            router.push(`/projects?${params.toString()}`, { scroll: false });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, router, searchParams]);

    const handleClear = () => {
        setSearchQuery('');
    };

    return (
        <div className="bg-[#F6F6F6] border-b border-gray-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Title & Icon */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-blue-200 shrink-0">
                    <LayoutGrid size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">Koleksi Project</h1>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{itemCount} Items</p>
                </div>
            </div>

            {/* Search Input Integrated into Header */}
            <div className="relative w-full max-w-md mx-auto sm:mx-0 order-3 sm:order-2">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari project, klien, atau kategori..."
                    className="w-full pl-9 pr-9 py-2 bg-gray-200/50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                />
                {searchQuery && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-300/50 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                )}
            </div>

            {/* View Mode & Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-2 sm:order-3">
                <div className="flex items-center bg-gray-200/50 p-1 rounded-md border border-gray-300/50">
                    <button className="p-1.5 bg-white shadow-sm rounded border border-gray-200 text-blue-600">
                        <Grid size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-white transition-colors rounded text-gray-400">
                        <List size={14} />
                    </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-[10px] font-black text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-widest leading-none">
                    <Filter size={12} /> Filter
                </button>
            </div>
        </div>
    );
}
