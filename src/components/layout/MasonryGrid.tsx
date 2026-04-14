'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import styles from './MasonryGrid.module.css';

interface MasonryGridProps {
    children: React.ReactNode;
    className?: string;
    columns?: 'default' | 'sidebar' | 'bottom';
    width?: number;
}

const defaultBreakpoints = {
    default: 6,    // Desktop (> 1280px)
    1280: 6,       // Desktop
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
        if (w >= 1024) return (breakpointColumns as Record<number, number>)[1024] || 4;
        if (w >= 768) return (breakpointColumns as Record<number, number>)[768] || 3;
        return 2; // Mobile
    };

    const [columnCount, setColumnCount] = useState(() => {
        if (typeof window === 'undefined') return 2;
        return getInitialCols();
    });

    // Pre-compute sorted breakpoints once — avoids re-sorting on every resize event
    const sortedBreakpoints = useMemo(() =>
        Object.keys(breakpointColumns)
            .filter(k => k !== 'default')
            .map(Number)
            .sort((a, b) => b - a),
        [breakpointColumns]
    );

    const getCols = useCallback((w: number) => {
        if (!breakpointColumns) return 2;
        let cols = breakpointColumns.default || 2;

        for (const bp of sortedBreakpoints) {
            if (w <= bp) {
                cols = (breakpointColumns as Record<number, number>)[bp];
            }
        }
        return cols;
    }, [breakpointColumns, sortedBreakpoints]);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));

        const updateCallback = (w: number) => {
            setColumnCount(prev => {
                const newCols = getCols(w);
                // BUG FIX: Only update if column count actually changed
                // Prevents unnecessary re-renders during scroll
                return prev === newCols ? prev : newCols;
            });
        };

        // 1. Explicit Width Mode (Prop-based) - Preferred for OS Windows
        if (width !== undefined) {
            updateCallback(width);
            return;
        }

        // 2. Observer Mode (DOM-based) - Fallback for standard pages
        if (!containerRef.current) return;

        // BUG FIX: Debounce resize handler to prevent flickering during scroll
        // FIX: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser compatibility
        let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
        const handleResize = (entries: ResizeObserverEntry[]) => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                for (const entry of entries) {
                    if (entry.contentRect.width > 0) {
                        updateCallback(entry.contentRect.width);
                    }
                }
            }, 100); // 100ms debounce
        };

        const observer = new ResizeObserver(handleResize);
        const elementToObserve = containerRef.current;
        observer.observe(elementToObserve);

        // Immediate check
        if (elementToObserve.offsetWidth > 0) {
            updateCallback(elementToObserve.offsetWidth);
        } else if (typeof window !== 'undefined') {
            // Fallback to window width if container has no width yet
            updateCallback(window.innerWidth);
        }

        return () => {
            // FIX: Unobserve specific element before disconnect to prevent memory leaks
            if (elementToObserve) {
                observer.unobserve(elementToObserve);
            }
            observer.disconnect();
            if (resizeTimeout) clearTimeout(resizeTimeout);
        };
    }, [getCols, width]);

    // SSR / Hydration Stability
    // We render the wrapper div immediately and only populate the Masonry 
    // library once client-side hooks are ready. This prevents the "native -> masonry" jump.
    if (!mounted) {
        return <div ref={containerRef} className="w-full" style={{ visibility: 'hidden', minHeight: '50vh' }} />;
    }



    // Use manual column count ONLY if explicit width is provided (OS Window mode)
    // Otherwise, let Masonry library handle responsiveness using the breakpoint object (Main Page mode)
    // This fixes the issue where ResizeObserver might report incorrect width on mobile initial load.
    const masonryCols = width !== undefined ? columnCount : breakpointColumns;

    return (
        <div ref={containerRef} className="w-full" style={{ width: '100%' }}>
            <Masonry
                breakpointCols={masonryCols}
                className={`${styles.masonryGrid} -ml-2 md:-ml-4 w-auto flex ${className}`}
                columnClassName={`${styles.masonryGridColumn} pl-2 md:pl-4 bg-clip-padding`}
            >
                {children}
            </Masonry>
        </div>
    );
}
