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

    // SSR Fallback: Use CSS Columns to simulate Masonry structure immediately
    // This allows the browser to paint images before React hydrates the Masonry library
    if (!mounted) {
        return (
            <div
                className={`w-full ${className}`}
                style={{
                    columnCount: columns === 'default' ? 4 : columns === 'sidebar' ? 3 : 4,
                    columnGap: '16px'
                }}
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
            className={`masonry-grid ${className}`}
            columnClassName="masonry-grid-column"
        >
            {children}
        </Masonry>
    );
}

