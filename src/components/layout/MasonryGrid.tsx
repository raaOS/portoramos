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

    // Container-aware responsive logic
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(2);

    useEffect(() => {
        setMounted(true);

        if (!containerRef.current) return;

        const updateCallback = (width: number) => {
            // Determine columns based on container width
            let cols = breakpointColumns.default;

            // Sort breakpoints descending (numeric keys)
            const breakpoints = Object.keys(breakpointColumns)
                .filter(k => k !== 'default')
                .map(Number)
                .sort((a, b) => b - a);

            for (let bp of breakpoints) {
                if (width <= bp) { // Changed to <= for inclusive
                    // Typescript key access workaround
                    cols = (breakpointColumns as any)[bp];
                }
            }
            setColumnCount(cols);
        };

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    updateCallback(entry.contentRect.width);
                }
            }
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);

        // Initial check using offsetWidth for reliability
        if (containerRef.current) {
            updateCallback(containerRef.current.offsetWidth);
        }

        return () => observer.disconnect();
    }, [breakpointColumns]);

    // SSR Fallback
    if (!mounted) {
        return (
            <div
                className={`w-full grid items-start content-start ${className} grid-cols-2 gap-4`}
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
        <div ref={containerRef} className="w-full" style={{ width: '100%' }}>
            <Masonry
                key={columnCount} // Force re-render when columns change
                breakpointCols={columnCount}
                className={`masonry-grid -ml-4 w-auto flex ${className}`}
                columnClassName="masonry-grid-column pl-4 bg-clip-padding"
            >
                {children}
            </Masonry>
        </div>
    );
}



