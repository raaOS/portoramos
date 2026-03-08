"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AboutData } from "@/types/about";
import { useSystemSound } from "@/hooks/useSystemSound";
import { useLayoutPersistence } from "@/app/about/_components/os/contexts/LayoutPersistenceContext";
import { useUnifiedZIndex } from "@/app/about/_components/os/context/UnifiedZIndexContext";

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
    csrfToken?: string;
    isAdmin?: boolean;
}

export const useWindowManager = ({ initialWindows, aboutData, csrfToken, isAdmin = false }: UseWindowManagerProps) => {
    const [windows, setWindows] = useState<WindowState[]>(initialWindows);
    const { bringToFront: bringToFrontZIndex } = useUnifiedZIndex();
    const [bouncingDocId, setBouncingDocId] = useState<string | null>(null);
    const { playOpen, playClose } = useSystemSound();
    const [isInitialized, setIsInitialized] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isPersistingRef = useRef(false);

    // Cleanup timeout on unmount to prevent memory leak
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Initialize windows based on server preferences (aboutData.windowPreferences)
    useEffect(() => {
        // We wait until aboutData is present AND contains windowPreferences
        // to ensure we don't mark as initialized with empty/loading state.
        if (!aboutData?.windowPreferences || isInitialized) return;

        const performInitialization = () => {
            setWindows(prev => {
                return prev.map(w => {
                    const pref = aboutData?.windowPreferences?.[w.id];
                    if (!pref) return w;

                    let rawWidth = pref.width || w.width || 800;
                    let rawHeight = pref.height || w.height || 600;
                    const isPinned = pref.isOpenByDefault || false;

                    const getCenterPositionStatic = (width: number, height: number) => {
                        const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
                        const safeHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                        return {
                            x: Math.max(0, (safeWidth - width) / 2),
                            y: Math.max(30, (safeHeight - height) / 2)
                        };
                    };

                    // Mobile logic
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    let width = rawWidth;
                    let height = rawHeight;

                    if (isMobile) {
                        width = Math.min(rawWidth, window.innerWidth * 0.95);
                        height = Math.min(rawHeight, window.innerHeight * 0.8);
                    }

                    const initialPosition = (pref.x !== undefined && pref.y !== undefined && !isMobile)
                        ? { x: pref.x, y: pref.y }
                        : getCenterPositionStatic(width, height);

                    // Set isOpen true ONLY if pref says so and it's not already open
                    const isOpen = pref.isOpenByDefault || w.isOpen;

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
            setIsInitialized(true);
        };

        // Using queueMicrotask to avoid synchronous setState in effect body warning
        // but still ensuring it happens immediately after mount/data arrival.
        queueMicrotask(performInitialization);
    }, [aboutData, isInitialized]);

    // Content Sync Effect: Update window content when initialWindows (and underlying data) changes
    useEffect(() => {
        let rafId: number;
        rafId = requestAnimationFrame(() => {
            setWindows(prev => prev.map(w => {
                const fresh = initialWindows.find(fw => fw.id === w.id);
                // Fix: Jangan timpa konten jika konten baru adalah null (dynamic content)
                if (fresh && fresh.content !== null && fresh.content !== w.content) {
                    return { ...w, content: fresh.content };
                }
                return w;
            }));
        });
        return () => cancelAnimationFrame(rafId);
    }, [initialWindows]);

    // Bounce cleanup - OPTIMIZED dengan cleanup yang benar
    useEffect(() => {
        if (!bouncingDocId) return;
        const timer = setTimeout(() => setBouncingDocId(null), 2000);
        return () => {
            clearTimeout(timer);
        };
    }, [bouncingDocId]);

    /**
     * Saves window position and default open state to the server.
     * Only works for authenticated admins.
     * 
     * @param id - Window ID
     * @param updates - Positional or state updates
     */
    const saveWindowPreference = useCallback(async (id: string, updates: Partial<{ x: number, y: number, width: number, height: number, isOpenByDefault: boolean }>) => {
        if (!aboutData || !isAdmin || !csrfToken) return;

        // GHOST BUG FIX: Prevent overwriting desktop layout from mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobile) {
            // We allow toggling 'isOpenByDefault' (pin) from mobile if needed, 
            // but we STRIP spatial updates (x, y, width, height)
            const spatialKeys = ['x', 'y', 'width', 'height'];
            const hasSpatialUpdate = Object.keys(updates).some(k => spatialKeys.includes(k));

            if (hasSpatialUpdate) {
                // If it's pure spatial, just stop. If mixed, filter it.
                const filteredUpdates = { ...updates };
                delete filteredUpdates.x;
                delete filteredUpdates.y;
                delete filteredUpdates.width;
                delete filteredUpdates.height;

                if (Object.keys(filteredUpdates).length === 0) return;
                updates = filteredUpdates;
            }
        }

        // Use debounce for manual moves to avoid race conditions
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        isPersistingRef.current = true;

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const currentPrefs = aboutData.windowPreferences || {};
                const newPrefs = {
                    ...currentPrefs,
                    [id]: { ...(currentPrefs[id] || {}), ...updates }
                };

                await fetch('/api/about', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify({ windowPreferences: newPrefs })
                });
            } catch (error) {
                console.error("[WindowManager] Failed to save preference:", error);
            } finally {
                setTimeout(() => {
                    isPersistingRef.current = false;
                }, 1000);
            }
        }, 800);
    }, [aboutData, csrfToken, isAdmin]);

    const _isWindowOpen = useCallback((id: string) => windows.find(w => w.id === id)?.isOpen ?? false, [windows]);

    // FIXED (BUG-009): Cache window dimensions dengan SSR-safe initialization
    const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

    // FIXED (BUG-009): SSR-safe dimensions update
    // BUG FIX #7: Throttled resize handler untuk mencegah terlalu banyak re-render
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

    // FIXED (BUG-009): Define getCenterPosition terlebih dahulu
    const getCenterPosition = useCallback((w: number, h: number) => {
        const { width: safeWidth, height: safeHeight } = windowDimensions;

        // Mobile override: use 90% of screen width if window is wider than screen
        const effectiveW = safeWidth < 768 ? Math.min(w, safeWidth * 0.95) : w;
        const effectiveH = safeWidth < 768 ? Math.min(h, safeHeight * 0.8) : h;

        const x = Math.max(0, (safeWidth - effectiveW) / 2);
        const y = Math.max(50, (safeHeight - effectiveH) / 2); // Start a bit lower on mobile
        return { x, y };
    }, [windowDimensions]);

    const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
        // Get unified z-index for this window
        const newZIndex = bringToFrontZIndex(id, 'window');

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
                            content: customConfig?.content || w.content,
                            title: customConfig?.title || w.title,
                        };
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
                        zIndex: newZIndex,
                        initialPosition: w.initialPosition || initialPosition,
                        width,
                        height,
                        // Allow updating content and title if provided
                        content: customConfig?.content || w.content,
                        title: customConfig?.title || w.title,
                    };
                }
                return w;
            });
        });
    }, [aboutData, playOpen, getCenterPosition, bringToFrontZIndex]);

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
        // Use unified z-index system - maximize also brings to front
        const newZIndex = bringToFrontZIndex(id, 'window');
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, isMaximized: !w.isMaximized, zIndex: newZIndex };
            return w;
        }));
    }, [bringToFrontZIndex]);

    const focusWindow = useCallback((id: string) => {
        // Use unified z-index system
        const newZIndex = bringToFrontZIndex(id, 'window');
        setWindows(prev => prev.map(w => {
            if (w.id === id) return { ...w, zIndex: newZIndex };
            return w;
        }));
    }, [bringToFrontZIndex]);

    const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
        setWindows(prev => {
            const updated = prev.map(w => {
                if (w.id === id) {
                    return { ...w, initialPosition: { x, y } };
                }
                return w;
            });
            
            // BUG FIX #2: Check isPinned from the window we're updating
            const win = prev.find(w => w.id === id);
            if (isAdmin || win?.isPinned) {
                // Use setTimeout to defer saveWindowPreference call
                setTimeout(() => saveWindowPreference(id, { x, y }), 0);
            }
            
            return updated;
        });
    }, [saveWindowPreference, isAdmin]);

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
        // Access latest state via setWindows callback to check isPinned/admin
        setWindows(prev => {
            const win = prev.find(w => w.id === id);
            if (isAdmin || win?.isPinned) {
                // Save via the unified debounced save function
                saveWindowPreference(id, { width, height });
            }
            return prev;
        });
    }, [saveWindowPreference, isAdmin]);

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
    }, [saveWindowPreference]);

    const resetWindows = useCallback(() => {
        setWindows(prev => prev.map(w => ({ ...w, isOpen: false, isMinimized: false, isMaximized: false })));
        // Note: Z-index reset is handled by UnifiedZIndexContext if needed
    }, []);

    // Register flush for window positions (save all current positions on logout)
    const { registerFlush, unregisterFlush } = useLayoutPersistence();
    const windowsRef = useRef(windows);
    windowsRef.current = windows;

    const flushWindowPositions = useCallback(async () => {
        if (!isAdmin || !csrfToken) return;

        try {
            // Build window preferences dari current windows state
            const windowPrefs: Record<string, unknown> = {};
            windowsRef.current.forEach(w => {
                if (w.isPinned || isAdmin) {
                    windowPrefs[w.id] = {
                        x: w.initialPosition?.x,
                        y: w.initialPosition?.y,
                        width: w.width,
                        height: w.height,
                        isOpenByDefault: w.isPinned
                    };
                }
            });

            await fetch('/api/about', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ windowPreferences: windowPrefs })
            });
            console.log('[WindowManager] Flushed window positions');
        } catch (error) {
            console.error('[WindowManager] Failed to flush window positions', error);
        }
    }, [isAdmin, csrfToken]);

    React.useEffect(() => {
        registerFlush('windowPositions', flushWindowPositions);
        return () => unregisterFlush('windowPositions');
    }, [flushWindowPositions, registerFlush, unregisterFlush]);

    // Request next z-index from unified system
    // Note: This is used by sticky notes and other components
    // The actual bring-to-front is handled by the component using the returned z-index
    const requestNextZIndex = useCallback((id?: string) => {
        // Use provided id or generate a temporary one
        const elementId = id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return bringToFrontZIndex(elementId, 'window');
    }, [bringToFrontZIndex]);

    return {
        windows,
        setWindows,
        requestNextZIndex,
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
