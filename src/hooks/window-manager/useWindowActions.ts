import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { WindowState } from './types';
import { AboutData } from '@/types/about';
import { ElementType } from '@/app/about/_components/os/context/UnifiedZIndexContext';
import { saveWindowPosition } from "@/app/about/_components/os/utils/positionSync";

interface UseWindowActionsProps {
    windows: WindowState[];
    setWindows: React.Dispatch<React.SetStateAction<WindowState[]>>;
    setBouncingDocId: React.Dispatch<React.SetStateAction<string | null>>;
    bringToFrontZIndex: (id: string, type: ElementType) => number;
    playOpen: () => void;
    playClose: () => void;
    getCenterPosition: (w: number, h: number) => { x: number, y: number };
    aboutData?: AboutData | null;
    isAdmin: boolean;
    csrfToken?: string;
    saveWindowPreference: (id: string, updates: Partial<{ x: number, y: number, width: number, height: number, isOpenByDefault: boolean }>) => Promise<void>;
}

export function useWindowActions({
    windows,
    setWindows,
    setBouncingDocId,
    bringToFrontZIndex,
    playOpen,
    playClose,
    getCenterPosition,
    aboutData,
    isAdmin,
    csrfToken,
    saveWindowPreference
}: UseWindowActionsProps) {

    const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
        const newZIndex = bringToFrontZIndex(id, 'window');

        const resolveWindowContent = (windowState?: WindowState, overrideContent?: ReactNode) => {
            if (overrideContent !== undefined) {
                return overrideContent;
            }
            if (windowState?.content != null) {
                return windowState.content;
            }
            return windowState?.contentFactory ? windowState.contentFactory() : null;
        };

        setWindows(prev => {
            const existingWindow = prev.find(w => w.id === id);

            const getMobileDims = (w?: number, h?: number) => {
                if (typeof window === 'undefined') return { width: w || 800, height: h || 600 };
                const isMobile = window.innerWidth < 768;
                if (!isMobile) return { width: w || 800, height: h || 600 };

                return {
                    width: Math.min(w || 800, window.innerWidth * 0.95),
                    height: Math.min(h || 600, window.innerHeight * 0.70)
                };
            };

            if (!existingWindow && customConfig) {
                const { width, height } = getMobileDims(customConfig.width, customConfig.height);

                const newWindow: WindowState = {
                    title: 'Window',
                    noPadding: false,
                    ...customConfig,
                    id,
                    isOpen: true,
                    zIndex: newZIndex,
                    initialPosition: customConfig.initialPosition || getCenterPosition(width, height),
                    width,
                    height,
                    content: customConfig.content
                };
                playOpen();
                return [...prev, newWindow];
            }

            return prev.map(w => {
                if (w.id === id) {
                    if (w.isOpen) {
                        return {
                         ...w,
                            isMinimized: false,
                            zIndex: newZIndex,
                            content: resolveWindowContent(w, customConfig?.content),
                            title: customConfig?.title || w.title,
                        };
                    }

                    const pref = aboutData?.windowPreferences?.[id];
                    const rawWidth = customConfig?.width || pref?.width || w.width || 800;
                    const rawHeight = customConfig?.height || pref?.height || w.height || 600;

                    const { width, height } = getMobileDims(rawWidth, rawHeight);
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

                    const initialPosition = (pref && pref.x !== undefined && pref.y !== undefined && !isMobile)
                        ? { x: pref.x, y: pref.y }
                        : getCenterPosition(width, height);

                    if (!w.isOpen) playOpen();

                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: newZIndex,
                        initialPosition: w.initialPosition || initialPosition,
                        width,
                        height,
                        content: resolveWindowContent(w, customConfig?.content),
                        title: customConfig?.title || w.title,
                    };
                }
                return w;
            });
        });
    }, [aboutData, playOpen, getCenterPosition, bringToFrontZIndex, setWindows]);

    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: false, isMinimized: false, isMaximized: false };
            }
            return w;
        }));
        playClose();
    }, [playClose, setWindows]);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, isMinimized: true };
            return w;
        }));
        setBouncingDocId(id);
    }, [setWindows, setBouncingDocId]);

    const maximizeWindow = useCallback((id: string) => {
        const newZIndex = bringToFrontZIndex(id, 'window');
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, isMaximized: !w.isMaximized, zIndex: newZIndex };
            return w;
        }));
    }, [bringToFrontZIndex, setWindows]);

    const focusWindow = useCallback((id: string) => {
        const newZIndex = bringToFrontZIndex(id, 'window');
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, zIndex: newZIndex };
            return w;
        }));
    }, [bringToFrontZIndex, setWindows]);

    const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
        const win = windows?.find(w => w.id === id);
        saveWindowPosition(id, { 
            x, 
            y, 
            width: win?.width,
            height: win?.height
        }, isAdmin);
        
        setWindows(prev => prev?.map(w => {
            if (w.id === id) {
                return { ...w, initialPosition: { x, y } };
            }
            return w;
        }));
        
        if (isAdmin && csrfToken) {
            queueMicrotask(() => saveWindowPreference(id, { x, y }));
        }
    }, [saveWindowPreference, isAdmin, csrfToken, windows, setWindows]);

    const handleWindowResize = useCallback((id: string, width: number, height: number) => {
        setWindows(prev => prev?.map(w => {
            if (w.id === id) {
                return { ...w, width, height };
            }
            return w;
        }));
    }, [setWindows]);

    const handleWindowResizeEnd = useCallback((id: string, width: number, height: number) => {
        saveWindowPosition(id, { width, height }, isAdmin);
        if (isAdmin && csrfToken) {
            queueMicrotask(() => saveWindowPreference(id, { width, height }));
        }
    }, [saveWindowPreference, isAdmin, csrfToken]);

    const togglePin = useCallback((id: string) => {
        const targetWindow = windows?.find(w => w.id === id);
        if (!targetWindow) return;

        const nextPinned = !targetWindow.isPinned;
        setWindows(prev => prev?.map(w => (
            w.id === id ? { ...w, isPinned: nextPinned } : w
        )));

        if (nextPinned) {
            void saveWindowPreference(id, {
                x: targetWindow.initialPosition?.x || 0,
                y: targetWindow.initialPosition?.y || 0,
                width: targetWindow.width,
                height: targetWindow.height,
                isOpenByDefault: true
            });
        } else {
            void saveWindowPreference(id, { isOpenByDefault: false });
        }
    }, [saveWindowPreference, windows, setWindows]);

    const resetWindows = useCallback(() => {
        setWindows(prev => prev.map(w => ({ ...w, isOpen: false, isMinimized: false, isMaximized: false })));
    }, [setWindows]);

    return {
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        handleWindowResize,
        handleWindowResizeEnd,
        togglePin,
        resetWindows
    };
}
