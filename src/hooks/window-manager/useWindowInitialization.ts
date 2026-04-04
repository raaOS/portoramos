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
        if (!aboutData?.windowPreferences) return;

        const performInitialization = () => {
            setWindows(prev => {
                return prev.map(w => {
                    const pref = aboutData?.windowPreferences?.[w.id];
                    if (!pref) {
                        return w;
                    }

                    const rawWidth = pref.width || w.width || 800;
                    const rawHeight = pref.height || w.height || 600;
                    const isPinned = pref.isOpenByDefault || false;

                    // Mobile logic
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    let width = rawWidth;
                    let height = rawHeight;

                    if (isMobile) {
                        width = Math.min(rawWidth, typeof window !== 'undefined' ? window.innerWidth * 0.95 : 800);
                        height = Math.min(rawHeight, typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600);
                    }

                    const initialPosition = (pref.x !== undefined && pref.y !== undefined && !isMobile)
                        ? { x: pref.x, y: pref.y }
                        : getCenterPositionStatic(width, height);

                    const isOpen = w.id === 'about' ? true : (pref.isOpenByDefault || false);

                    return {
                        ...w,
                        isOpen,
                        isPinned,
                        width,
                        height,
                        initialPosition
                    };
                });
            });
        };

        queueMicrotask(performInitialization);
    }, [aboutData, setWindows, getCenterPositionStatic]);

    // Content Sync Effect: Update window content when initialWindows changes
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setWindows(prev => prev.map(w => {
                const fresh = initialWindows.find(fw => fw.id === w.id);
                if (fresh && fresh.content !== null && fresh.content !== w.content) {
                    return { ...w, content: fresh.content };
                }
                return w;
            }));
        });
        return () => cancelAnimationFrame(rafId);
    }, [initialWindows, setWindows]);
}
