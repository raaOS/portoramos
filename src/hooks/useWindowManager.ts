"use client";

import { useState, useCallback, useEffect } from "react";
import { AboutData } from "@/types/about";
import { Project } from "@/types/projects";
import { useSystemSound } from "@/hooks/useSystemSound";

export interface WindowState {
    id: string;
    title: string;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    zIndex: number;
    noPadding?: boolean;
    content: React.ReactNode;
    initialPosition?: { x: number; y: number };
    width?: number;
    height?: number;
    isPinned?: boolean;
}

interface UseWindowManagerProps {
    initialWindows: WindowState[];
    aboutData?: AboutData | null;
    projects: Project[];
}

export const useWindowManager = ({ initialWindows, aboutData }: UseWindowManagerProps) => {
    const [windows, setWindows] = useState<WindowState[]>(initialWindows);
    const [topZIndex, setTopZIndex] = useState(20);
    const [bouncingDocId, setBouncingDocId] = useState<string | null>(null);
    const { playOpen, playClose } = useSystemSound();
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize windows based on aboutData preferences
    useEffect(() => {
        if (aboutData && !isInitialized) {
            setWindows(prev => prev.map(w => {
                const pref = aboutData?.windowPreferences?.[w.id];
                const width = pref?.width || w.width || 800;
                const height = pref?.height || w.height || 600;
                const isPinned = pref?.isOpenByDefault || false;

                const getCenterPosition = (w: number, h: number) => {
                    if (typeof window === 'undefined') return { x: 0, y: 0 };
                    const safeWidth = window.innerWidth || 1200;
                    const safeHeight = window.innerHeight || 800;
                    const x = Math.max(0, (safeWidth - w) / 2);
                    const y = Math.max(30, (safeHeight - h) / 2);
                    return { x, y };
                };

                const initialPosition = (pref && pref.x !== undefined && pref.y !== undefined)
                    ? { x: pref.x, y: pref.y }
                    : w.initialPosition || getCenterPosition(width, height);

                let isOpen = w.isOpen;
                if (!isInitialized) {
                    isOpen = pref?.isOpenByDefault || w.isOpen;
                }

                return {
                    ...w,
                    isOpen,
                    isPinned,
                    width,
                    height,
                    initialPosition
                };
            }));
            setIsInitialized(true);
        }
    }, [aboutData, isInitialized]);

    // Bounce cleanup
    useEffect(() => {
        if (!bouncingDocId) return;
        const timer = setTimeout(() => setBouncingDocId(null), 2000);
        return () => clearTimeout(timer);
    }, [bouncingDocId]);

    const saveWindowPreference = async (id: string, updates: Partial<{ x: number, y: number, width: number, height: number, isOpenByDefault: boolean }>) => {
        if (!aboutData) return;
        try {
            const currentPrefs = aboutData.windowPreferences || {};
            const newPrefs = {
                ...currentPrefs,
                [id]: { ...(currentPrefs[id] || {}), ...updates }
            };
            await fetch('/api/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ windowPreferences: newPrefs })
            });
        } catch (e) {
            console.error("Failed to save window preference", e);
        }
    };

    const isWindowOpen = useCallback((id: string) => windows.find(w => w.id === id)?.isOpen ?? false, [windows]);

    const getCenterPosition = (w: number, h: number) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const safeWidth = window.innerWidth || 1200;
        const safeHeight = window.innerHeight || 800;
        const x = Math.max(0, (safeWidth - w) / 2);
        const y = Math.max(30, (safeHeight - h) / 2);
        return { x, y };
    };

    const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
        setWindows(prev => {
            const existingWindow = prev.find(w => w.id === id);

            // If window doesn't exist yet (dynamic windows provided via customConfig)
            if (!existingWindow && customConfig) {
                const newWindow: WindowState = {
                    id,
                    title: customConfig.title || 'Window',
                    isOpen: true,
                    zIndex: topZIndex + 1,
                    noPadding: customConfig.noPadding || false,
                    initialPosition: customConfig.initialPosition || getCenterPosition(customConfig.width || 800, customConfig.height || 600),
                    width: customConfig.width || 800,
                    height: customConfig.height || 600,
                    content: customConfig.content,
                    ...customConfig
                };
                playOpen();
                setTopZIndex(z => z + 1);
                return [...prev, newWindow];
            }

            return prev.map(w => {
                if (w.id === id) {
                    if (w.isOpen) {
                        return { ...w, isMinimized: false, zIndex: topZIndex + 1 };
                    }

                    const pref = aboutData?.windowPreferences?.[id];
                    const width = customConfig?.width || pref?.width || w.width || 800;
                    const height = customConfig?.height || pref?.height || w.height || 600;

                    const initialPosition = (pref && pref.x !== undefined && pref.y !== undefined)
                        ? { x: pref.x, y: pref.y }
                        : getCenterPosition(width, height);

                    if (!w.isOpen) playOpen();

                    return {
                        ...w,
                        isOpen: true,
                        isMinimized: false,
                        zIndex: topZIndex + 1,
                        initialPosition: w.initialPosition || initialPosition,
                        width,
                        height
                    };
                }
                return w;
            });
        });
        setTopZIndex(prev => prev + 1);
    }, [aboutData, playOpen, topZIndex]);

    const closeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                return { ...w, isOpen: false, isMinimized: false, isMaximized: false };
            }
            return w;
        }));
        playClose();
    }, [playClose]);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, isMinimized: true };
            return w;
        }));
        setBouncingDocId(id);
    }, []);

    const maximizeWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, isMaximized: !w.isMaximized, zIndex: topZIndex + 1 };
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    }, [topZIndex]);

    const focusWindow = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, zIndex: topZIndex + 1 };
            return w;
        }));
        setTopZIndex(prev => prev + 1);
    }, [topZIndex]);

    const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                if (w.isPinned) saveWindowPreference(id, { x, y });
                return { ...w, initialPosition: { x, y } };
            }
            return w;
        }));
    }, [aboutData]);

    const handleWindowResize = useCallback((id: string, width: number, height: number) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                if (w.isPinned) saveWindowPreference(id, { width, height });
                return { ...w, width, height };
            }
            return w;
        }));
    }, [aboutData]);

    const togglePin = useCallback((id: string) => {
        setWindows(prev => prev.map(w => {
            if (w.id === id) {
                const isPinned = !w.isPinned;
                if (isPinned) {
                    saveWindowPreference(id, {
                        x: w.initialPosition?.x || 0,
                        y: w.initialPosition?.y || 0,
                        width: w.width,
                        height: w.height,
                        isOpenByDefault: true
                    });
                } else {
                    saveWindowPreference(id, { isOpenByDefault: false });
                }
                return { ...w, isPinned };
            }
            return w;
        }));
    }, [aboutData]);

    const resetWindows = useCallback(() => {
        setWindows(prev => prev.map(w => ({ ...w, isOpen: false, isMinimized: false, isMaximized: false })));
        setTopZIndex(20);
    }, []);

    // Legacy support wrappers to match original API
    const simpleOpenWindow = (id: string, customWidth?: number, customHeight?: number) => {
        openWindow(id, { width: customWidth, height: customHeight });
    }

    return {
        windows,
        setWindows,
        topZIndex,
        bouncingDocId,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        handleWindowResize,
        togglePin,
        resetWindows
    };
};
