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

    // Initialize windows based on server preferences (aboutData.windowPreferences)
    useEffect(() => {
        if (aboutData && !isInitialized) {
            setWindows(prev => prev.map(w => {
                const pref = aboutData?.windowPreferences?.[w.id];

                // Use server preferences only
                // Use server preferences only
                let rawWidth = pref?.width || w.width || 800;
                let rawHeight = pref?.height || w.height || 600;
                const isPinned = pref?.isOpenByDefault || false;

                const getCenterPosition = (w: number, h: number) => {
                    if (typeof window === 'undefined') return { x: 0, y: 0 };
                    const safeWidth = window.innerWidth || 1200;
                    const safeHeight = window.innerHeight || 800;
                    const x = Math.max(0, (safeWidth - w) / 2);
                    const y = Math.max(30, (safeHeight - h) / 2);
                    return { x, y };
                };

                // Mobile logic
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                let width = rawWidth;
                let height = rawHeight;

                if (isMobile) {
                    width = Math.min(rawWidth, window.innerWidth * 0.95);
                    height = Math.min(rawHeight, window.innerHeight * 0.8);
                }

                const initialPosition = (pref && pref.x !== undefined && pref.y !== undefined && !isMobile)
                    ? { x: pref.x, y: pref.y }
                    : getCenterPosition(width, height);

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

    // Content Sync Effect: Update window content when initialWindows (and underlying data) changes
    useEffect(() => {
        setWindows(prev => prev.map(w => {
            const fresh = initialWindows.find(fw => fw.id === w.id);
            if (fresh && fresh.content !== w.content) {
                return { ...w, content: fresh.content };
            }
            return w;
        }));
    }, [initialWindows]);

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

        // Mobile override: use 90% of screen width if window is wider than screen
        const effectiveW = safeWidth < 768 ? Math.min(w, safeWidth * 0.95) : w;
        const effectiveH = safeWidth < 768 ? Math.min(h, safeHeight * 0.8) : h;

        const x = Math.max(0, (safeWidth - effectiveW) / 2);
        const y = Math.max(50, (safeHeight - effectiveH) / 2); // Start a bit lower on mobile
        return { x, y };
    };

    const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
        setWindows(prev => {
            const existingWindow = prev.find(w => w.id === id);

            // Calculate mobile-friendly dimensions
            const getMobileDims = (w?: number, h?: number) => {
                if (typeof window === 'undefined') return { width: w || 800, height: h || 600 };
                const isMobile = window.innerWidth < 768;
                if (!isMobile) return { width: w || 800, height: h || 600 };

                return {
                    width: Math.min(w || 800, window.innerWidth * 0.95),
                    height: Math.min(h || 600, window.innerHeight * 0.70)
                };
            };

            // If window doesn't exist yet (dynamic windows provided via customConfig)
            if (!existingWindow && customConfig) {
                const { width, height } = getMobileDims(customConfig.width, customConfig.height);

                const newWindow: WindowState = {
                    title: 'Window',
                    noPadding: false,
                    ...customConfig,
                    id,
                    isOpen: true,
                    zIndex: topZIndex + 1,
                    initialPosition: customConfig.initialPosition || getCenterPosition(width, height),
                    width,
                    height,
                    content: customConfig.content
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
                    let rawWidth = customConfig?.width || pref?.width || w.width || 800;
                    let rawHeight = customConfig?.height || pref?.height || w.height || 600;

                    // Apply mobile constraints
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
                // REMOVED: saveWindowPreference call - moved to handleWindowResizeEnd
                return { ...w, width, height };
            }
            return w;
        }));
    }, []);

    const handleWindowResizeEnd = useCallback((id: string, width: number, height: number) => {
        // Access latest state via setWindows callback to check isPinned
        setWindows(prev => {
            const win = prev.find(w => w.id === id);
            if (win?.isPinned) {
                // Save via authenticated API call (admin only - cookies sent automatically)
                (async () => {
                    try {
                        // Fetch current preferences from server
                        const res = await fetch('/api/about');
                        const currentData = await res.json();
                        const currentPrefs = currentData?.windowPreferences || {};

                        // Merge new dimensions
                        const newPrefs = {
                            ...currentPrefs,
                            [id]: { ...(currentPrefs[id] || {}), width, height }
                        };

                        // Save back with credentials (admin cookie sent automatically)
                        const saveRes = await fetch('/api/about', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include', // Important: sends cookies for auth
                            body: JSON.stringify({ windowPreferences: newPrefs })
                        });

                        if (saveRes.ok) {
                            console.log('Window size saved to server:', { id, width, height });
                        } else if (saveRes.status !== 401 && saveRes.status !== 403) {
                            // Only log real errors, ignore auth errors for visitors
                            console.error('Failed to save window size:', saveRes.status, await saveRes.text());
                        }
                    } catch (e) {
                        console.error("Failed to save window size:", e);
                    }
                })();
            }
            return prev; // No state change, just side effect
        });
    }, []);

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
        handleWindowResizeEnd,
        togglePin,
        resetWindows
    };
};
