'use client';

import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';

interface MasonryGridProps {
    children: React.ReactNode;
    className?: string;
    columns?: 'default' | 'sidebar' | 'bottom';
    width?: number;
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

export default function MasonryGrid({ children, className = '', columns = 'default', width }: MasonryGridProps) {
    const breakpointColumns = columns === 'sidebar' ? sidebarBreakpoints : columns === 'bottom' ? bottomBreakpoints : defaultBreakpoints;
    const [mounted, setMounted] = useState(false);

    // Container-aware responsive logic
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(2);

    // Helper: calculate columns from a width
    const getCols = (w: number) => {
        let cols = breakpointColumns.default;
        // Sort breakpoints descending (numeric keys)
        const breakpoints = Object.keys(breakpointColumns)
            .filter(k => k !== 'default')
            .map(Number)
            .sort((a, b) => b - a);
        for (let bp of breakpoints) {
            if (w <= bp) { // Changed to <= for inclusive
                cols = (breakpointColumns as any)[bp];
            }
        }
        return cols;
    };

    useEffect(() => {
        setMounted(true);

        const updateCallback = (w: number) => {
            setColumnCount(getCols(w));
        };

        // IF width prop is provided, use it directly (stateless/controlled mode)
        if (width !== undefined) {
            console.log('MasonryGrid: Using explicit width prop:', width);
            updateCallback(width);
            // Return early to avoid setting up resize observer
            return;
        }

        if (!containerRef.current) return;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    updateCallback(entry.contentRect.width);
                }
            }
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);

        // Initial check
        if (containerRef.current) {
            updateCallback(containerRef.current.offsetWidth);
        }

        // AGGRESSIVE POLLING: Check repeatedly for 1s to catch any animation-related width changes
        // This fixes the "grid error on re-open" bug where initial width might be reported as 0 or incorrect.
        let checks = 0;
        const interval = setInterval(() => {
            if (containerRef.current && containerRef.current.offsetWidth > 0) {
                updateCallback(containerRef.current.offsetWidth);
            }
            checks++;
            if (checks > 10) clearInterval(interval); // Stop after 1s
        }, 100);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [breakpointColumns, width]); // Added width as dependency

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



