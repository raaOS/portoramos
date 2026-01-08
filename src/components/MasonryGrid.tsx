'use client';

import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';

interface MasonryGridProps {
    children: React.ReactNode;
    className?: string;
    columns?: 'default' | 'sidebar' | 'bottom';
}

const defaultBreakpoints = {
    default: 7,    // Desktop XL (1536px+)
    1536: 5,       // Desktop L
    1280: 4,       // Desktop
    1024: 3,       // Tablet L
    768: 2,        // Tablet
    640: 2         // Mobile L
};

const sidebarBreakpoints = {
    default: 3,    // Max 3 columns for sidebar
    1280: 3,       // Desktop
    1024: 2,       // Tablet L
    768: 2,        // Tablet
    640: 2         // Mobile
};

const bottomBreakpoints = {
    default: 6,    // 6 columns to match 3+3 layout
    1536: 6,       // Desktop L
    1280: 4,       // Desktop
    1024: 3,       // Tablet L
    768: 2,        // Tablet
    640: 2         // Mobile L
};

export default function MasonryGrid({ children, className = '', columns = 'default' }: MasonryGridProps) {
    const breakpointColumns = columns === 'sidebar' ? sidebarBreakpoints : columns === 'bottom' ? bottomBreakpoints : defaultBreakpoints;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // SSR Fallback: Use CSS Grid to simulate Masonry structure immediately
    // Using grid-cols ensures items are visible instantly in the correct approximate position
    // We match the gap to the actual masonry grid (gap-x-4 = 16px usually)
    if (!mounted) {
        return (
            <div
                className={`w-full grid items-start content-start ${className} ${columns === 'sidebar'
                    ? 'grid-cols-2 lg:grid-cols-3 gap-4'
                    : columns === 'bottom'
                        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4'
                    }`}
            >
                {React.Children.map(children, (child) => (
                    <div className="mb-4 break-inside-avoid">
                        {child}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Masonry
            breakpointCols={breakpointColumns}
            className={`masonry-grid -ml-4 w-auto flex ${className}`}
            columnClassName="masonry-grid-column pl-4 bg-clip-padding"
        >
            {children}
        </Masonry>
    );
}

