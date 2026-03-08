"use client";

import React, { useState, useRef, useCallback } from "react";
import { AboutData } from "@/types/about";
import { useLayoutPersistence } from "../contexts/LayoutPersistenceContext";

interface UseDesktopLayoutProps {
    aboutData?: AboutData | null;
    isAdmin: boolean;
    csrfToken: string | null;
}

export function useDesktopLayout({ aboutData, isAdmin, csrfToken }: UseDesktopLayoutProps) {
    // Local state for icon positions (Optimistic UI)
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(
        aboutData?.desktopPreferences?.iconPositions || {}
    );
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Persistence Lock: Prevents server data (props) from overwriting local 
    // optimistic state while a save is in progress or pending.
    const isPersistingRef = useRef(false);
    // Track latest positions for flush on logout
    const latestPositionsRef = useRef(iconPositions);

    // Get flush registration function from context
    const { registerFlush, unregisterFlush } = useLayoutPersistence();

    // Sync state with props during render if props changed
    // This avoids useEffect cascading renders
    const [prevAboutData, setPrevAboutData] = useState(aboutData);
    if (aboutData !== prevAboutData) {
        setPrevAboutData(aboutData);
        if (aboutData?.desktopPreferences?.iconPositions && !isPersistingRef.current) {
            setIconPositions(aboutData.desktopPreferences.iconPositions);
        }
    }

    // Update ref saat state berubah
    latestPositionsRef.current = iconPositions;

    // Register flush function untuk save on logout
    const flushSave = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        // Force save latest positions
        if (isAdmin && csrfToken) {
            try {
                const payload = {
                    desktopPreferences: {
                        ...aboutData?.desktopPreferences,
                        iconPositions: latestPositionsRef.current
                    }
                };

                await fetch('/api/admin/about/desktop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                console.log('[DesktopLayout] Flushed icon positions');
            } catch (error) {
                console.error("[DesktopLayout] Failed to flush icon positions", error);
            }
        }
    }, [isAdmin, csrfToken, aboutData?.desktopPreferences]);

    // Register flush on mount, unregister on unmount
    React.useEffect(() => {
        registerFlush('iconPositions', flushSave);
        return () => unregisterFlush('iconPositions');
    }, [flushSave, registerFlush, unregisterFlush]);

    const handleIconPositionChange = (id: string, x: number, y: number) => {
        // 1. Optimistic Update
        const newPositions = { ...iconPositions, [id]: { x, y } };
        setIconPositions(newPositions);
        latestPositionsRef.current = newPositions;

        // 2. Persist if Admin (Debounced)
        if (isAdmin) {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            if (isMobile) return; // GHOST BUG FIX: Don't save icon positions from mobile

            isPersistingRef.current = true; // Lock incoming syncs
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    // Update layout preference with ALL current positions
                    const payload = {
                        desktopPreferences: {
                            ...aboutData?.desktopPreferences,
                            iconPositions: newPositions
                        }
                    };

                    await fetch('/api/admin/about/desktop', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': csrfToken || ''
                        },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    });
                } catch (error) {
                    console.error("Failed to save icon position", error instanceof Error ? error.message : error);
                } finally {
                    // Unlock sync after a grace period to allow server state to stabilize
                    setTimeout(() => {
                        isPersistingRef.current = false;
                    }, 2000);
                }
            }, 1000); // 1-second debounce
        }
    };

    return {
        iconPositions,
        setIconPositions,
        handleIconPositionChange
    };
}
