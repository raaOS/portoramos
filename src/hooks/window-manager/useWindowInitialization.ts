import { useEffect } from 'react';
import { AboutData } from '@/types/about';
import { WindowState } from './types';

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
                    
                    // Base dimensions
                    const rawWidth = pref?.width || w.width || 800;
                    const rawHeight = pref?.height || w.height || 600;
                    const isPinned = pref?.isOpenByDefault || false;

                    // Mobile logic
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    let width = rawWidth;
                    let height = rawHeight;

                    if (isMobile) {
                        width = Math.min(rawWidth, typeof window !== 'undefined' ? window.innerWidth * 0.95 : 800);
                        height = Math.min(rawHeight, typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600);
                    }

                    const initialPosition = (pref?.x !== undefined && pref?.y !== undefined && !isMobile)
                        ? { x: pref.x, y: pref.y }
                        : getCenterPositionStatic(width, height);

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
