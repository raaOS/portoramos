import { useEffect } from 'react';
import { AboutData } from '@/types/about';
import { WindowState } from './types';

/** SSR-safe viewport dimensions helper */
function getViewport() {
    if (typeof window === 'undefined') return { width: 1440, height: 900 };
    return { width: window.innerWidth, height: window.innerHeight };
}

interface UseWindowInitializationProps {
    initialWindows: WindowState[];
    aboutData?: AboutData | null;
    setWindows: React.Dispatch<React.SetStateAction<WindowState[]>>;
    getCenterPositionStatic: (width: number, height: number) => { x: number, y: number };
}

export function useWindowInitialization({ initialWindows, aboutData, setWindows, getCenterPositionStatic }: UseWindowInitializationProps) {
    // Initialize/re-initialize windows based on server preferences
    useEffect(() => {
        const performInitialization = () => {
            setWindows(prev => {
                // We iterate over initialWindows to ensure every "system" window is represented
                const reconciled = initialWindows.map(baseW => {
                    const existing = prev.find(w => w.id === baseW.id);
                    const w = { ...baseW, ...existing }; // keep existing state like isOpen, content, if present

                    const pref = aboutData?.windowPreferences?.[w.id];

                    // Viewport detection
                    const vp = getViewport();
                    const isMobile = vp.width < 768;

                    // Calculate dimensions - prefer percentage if available
                    let width: number;
                    let height: number;

                    if (pref?.widthPct !== undefined && pref?.heightPct !== undefined) {
                        // Use percentage-based sizing
                        width = (pref.widthPct / 100) * vp.width;
                        height = (pref.heightPct / 100) * vp.height;
                    } else {
                        // Legacy pixel fallback
                        width = pref?.width || w.width || 800;
                        height = pref?.height || w.height || 600;
                    }

                    // Mobile: clamp dimensions to fit screen
                    if (isMobile) {
                        width = Math.min(width, vp.width * 0.95);
                        height = Math.min(height, vp.height * 0.8);
                    } else {
                        // Desktop: clamp to prevent overflow
                        width = Math.min(width, vp.width * 0.95);
                        height = Math.min(height, vp.height * 0.95);
                    }

                    // Ensure minimum dimensions
                    width = Math.max(width, 300);
                    height = Math.max(height, 200);

                    // Calculate position - prefer percentage if available
                    let x: number;
                    let y: number;

                    if (pref?.xPct !== undefined && pref?.yPct !== undefined) {
                        // Use percentage-based positioning
                        x = (pref.xPct / 100) * vp.width;
                        y = (pref.yPct / 100) * vp.height;
                    } else if (pref?.x !== undefined && pref?.y !== undefined && !isMobile) {
                        // Legacy pixel fallback (only on desktop)
                        x = pref.x;
                        y = pref.y;
                    } else {
                        // Default: center on screen
                        const centerPos = getCenterPositionStatic(width, height);
                        x = centerPos.x;
                        y = centerPos.y;
                    }

                    // Clamp position to ensure window is always visible
                    const margin = 20;
                    x = Math.max(margin, Math.min(x, vp.width - width - margin));
                    y = Math.max(margin, Math.min(y, vp.height - height - margin));

                    const initialPosition = { x, y };
                    const isPinned = pref?.isOpenByDefault || false;

                    // Hydrate content if missing but factory exists
                    let content = w.content;
                    if (content === null && baseW.contentFactory) {
                        content = baseW.contentFactory();
                    }

                    // If it was already open in state, keep it open.
                    // Otherwise, follow server preference or force 'about' (initial visibility logic).
                    const isOpen = w.isOpen ?? (w.id === 'about' ? true : (pref?.isOpenByDefault || false));

                    return {
                        ...w,
                        content,
                        isOpen,
                        isPinned,
                        width,
                        height,
                        initialPosition
                    };
                });

                // Preserve any custom windows not in initialWindows (e.g. dynamic windows)
                const dynamic = prev.filter(w => !initialWindows.some(iw => iw.id === w.id));
                
                return [...reconciled, ...dynamic];
            });
        };

        const rafId = requestAnimationFrame(performInitialization);
        return () => cancelAnimationFrame(rafId);
    }, [aboutData, initialWindows, setWindows, getCenterPositionStatic]);

    // Content Sync Effect: Update window content whenever initialWindows definitions change
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setWindows(prev => {
                // Ensure reconciled list is used to avoid losing windows
                const reconciled = initialWindows.map(fresh => {
                    const existing = prev.find(w => w.id === fresh.id);
                    if (!existing) return fresh;

                    // Update content if fresh content is available or if current content is null
                    let updatedContent = existing.content;
                    if (fresh.content !== null && fresh.content !== existing.content) {
                        updatedContent = fresh.content;
                    } else if (existing.content === null && fresh.contentFactory) {
                        updatedContent = fresh.contentFactory();
                    }

                    return { ...existing, content: updatedContent };
                });

                const dynamic = prev.filter(w => !initialWindows.some(iw => iw.id === w.id));
                return [...reconciled, ...dynamic];
            });
        });
        return () => cancelAnimationFrame(rafId);
    }, [initialWindows, setWindows]);
}
