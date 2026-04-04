import { useState, useEffect, useCallback } from 'react';

export function useWindowDimensions() {
    // Cache window dimensions with SSR-safe initialization
    const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

    // SSR-safe dimensions update with throttling
    useEffect(() => {
        let resizeTimeout: NodeJS.Timeout | null = null;
        let frameId: number | null = null;
        
        const updateDimensions = () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                setWindowDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            });
        };
        
        // Throttled version - max 10 updates per second
        const throttledUpdate = () => {
            if (resizeTimeout) return;
            resizeTimeout = setTimeout(() => {
                resizeTimeout = null;
                updateDimensions();
            }, 100);
        };

        updateDimensions();
        window.addEventListener('resize', throttledUpdate);
        return () => {
            window.removeEventListener('resize', throttledUpdate);
            if (resizeTimeout) clearTimeout(resizeTimeout);
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, []);

    const getCenterPositionStatic = (width: number, height: number) => {
        const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const safeHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        return {
            x: Math.max(0, (safeWidth - width) / 2),
            y: Math.max(30, (safeHeight - height) / 2)
        };
    };

    const getCenterPosition = useCallback((w: number, h: number) => {
        const { width: safeWidth, height: safeHeight } = windowDimensions;

        // Mobile override: use 90% of screen width if window is wider than screen
        const effectiveW = safeWidth < 768 ? Math.min(w, safeWidth * 0.95) : w;
        const effectiveH = safeWidth < 768 ? Math.min(h, safeHeight * 0.8) : h;

        const x = Math.max(0, (safeWidth - effectiveW) / 2);
        const y = Math.max(50, (safeHeight - effectiveH) / 2); // Start a bit lower on mobile
        return { x, y };
    }, [windowDimensions]);

    return { 
        windowDimensions, 
        getCenterPosition,
        getCenterPositionStatic
    };
}
