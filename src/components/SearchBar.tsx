'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    resultsCount?: number;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = "Search projects...",
    resultsCount
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="search"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-gray-200 focus:border-black focus:outline-none transition-colors text-lg"
                />
                {localValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                )}
            </div>

            {localValue && resultsCount !== undefined && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                    {resultsCount} {resultsCount === 1 ? 'project' : 'projects'} found
                </p>
            )}
        </div>
    );
}
