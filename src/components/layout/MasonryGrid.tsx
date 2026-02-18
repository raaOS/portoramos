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
    default: 7,    // Desktop (> 1280px)
    1280: 7,       // Desktop
    1024: 5,       // Tablet L
    768: 4,        // Match md:grid-cols-4
    640: 3,        // Match sm:grid-cols-3
    0: 2           // Base
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

    // Determine initial default based on the columns prop type
    // Use window width if available to prevent desktop showing as mobile initially
    const getInitialCols = () => {
        if (typeof window === 'undefined') return 2; // SSR fallback
        const w = window.innerWidth;
        if (w >= 1280) return breakpointColumns.default || 7;
        if (w >= 1024) return (breakpointColumns as any)[1024] || 4;
        if (w >= 768) return (breakpointColumns as any)[768] || 3;
        return 2; // Mobile
    };

    const [columnCount, setColumnCount] = useState(() => {
        if (typeof window === 'undefined') return 2;
        return getInitialCols();
    });

    const getCols = (w: number) => {
        if (!breakpointColumns) return 2; // Safety fallback
        let cols = breakpointColumns.default || 2;

        // Sort breakpoints descending (numeric keys)
        const breakpoints = Object.keys(breakpointColumns)
            .filter(k => k !== 'default')
            .map(Number)
            .sort((a, b) => b - a);

        for (let bp of breakpoints) {
            if (w <= bp) {
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

        // 1. Explicit Width Mode (Prop-based) - Preferred for OS Windows
        if (width !== undefined) {
            updateCallback(width);
            return;
        }

        // 2. Observer Mode (DOM-based) - Fallback for standard pages
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

        // Immediate check
        if (containerRef.current.offsetWidth > 0) {
            updateCallback(containerRef.current.offsetWidth);
        } else if (typeof window !== 'undefined') {
            // Fallback to window width if container has no width yet
            updateCallback(window.innerWidth);
        }

        return () => {
            observer.disconnect();
        };
    }, [breakpointColumns, width]); // Added width as dependency

    // Helper to determine grid classes based on props
    const getGridClasses = () => {
        if (columns === 'sidebar') return 'grid-cols-2 lg:grid-cols-3';
        if (columns === 'bottom') return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6';

        // Match defaultBreakpoints EXACTLY
        return 'grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';
    };

    const renderNativeGrid = () => (
        <div
            className={`w-full grid items-start content-start ${className} ${getGridClasses()} gap-2 md:gap-4`}
        >
            {React.Children.map(children, (child) => (
                <div className="mb-2 md:mb-4 break-inside-avoid">
                    {child}
                </div>
            ))}
        </div>
    );

    // SSR / Hydration Stability
    // We render the wrapper div immediately and only populate the Masonry 
    // library once client-side hooks are ready. This prevents the "native -> masonry" jump.
    if (!mounted) {
        return <div ref={containerRef} className="w-full opacity-0" />;
    }

    // Optimization removed: User requested true masonry layout. 
    // Native Grid causes gaps with varying heights.
    // We will use react-masonry-css for all sizes.

    /* 
    if (columnCount <= 2) {
        return renderNativeGrid();
    } 
    */

    // Use manual column count ONLY if explicit width is provided (OS Window mode)
    // Otherwise, let Masonry library handle responsiveness using the breakpoint object (Main Page mode)
    // This fixes the issue where ResizeObserver might report incorrect width on mobile initial load.
    const masonryCols = width !== undefined ? columnCount : breakpointColumns;

    return (
        <div ref={containerRef} className="w-full" style={{ width: '100%' }}>
            <Masonry
                breakpointCols={masonryCols}
                className={`masonry-grid -ml-2 md:-ml-4 w-auto flex ${className}`}
                columnClassName="masonry-grid-column pl-2 md:pl-4 bg-clip-padding"
            >
                {children}
            </Masonry>
        </div>
    );
}



