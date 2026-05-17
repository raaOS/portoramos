"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AboutData, DesktopIconPosition } from "@/types/about";
import { getIconPosition, saveIconPosition, loadPositions, loadSessionPositions } from "../utils/positionSync";
import { useLayoutPersistence } from "../contexts/LayoutPersistenceContext";

interface UseDesktopLayoutProps {
    aboutData?: AboutData | null;
    isAdmin: boolean;
    csrfToken: string | null;
}

export function useDesktopLayout({ aboutData, isAdmin, csrfToken }: UseDesktopLayoutProps) {
    const { registerFlush, unregisterFlush } = useLayoutPersistence();

    // Load dari positionSync (localStorage untuk admin, CLOUDFLARE_D1/default untuk visitor)
    const [iconPositions, setIconPositions] = useState<Record<string, DesktopIconPosition>>(() => {
        const CLOUDFLARE_D1 = aboutData?.desktopPreferences?.iconPositions || {};

        if (isAdmin) {
            // Admin: localStorage menimpa CLOUDFLARE_D1 (buffer sesi)
            const local = loadPositions().icons || {};
            return { ...CLOUDFLARE_D1, ...local };
        } else {
            // Visitor: Murni CLOUDFLARE_D1 (Admin's template) - Reset on refresh
            return CLOUDFLARE_D1;
        }
    });

    // Ref to track latest iconPositions without adding to dependency array
    const iconPositionsRef = React.useRef(iconPositions);
    
    React.useLayoutEffect(() => {
        iconPositionsRef.current = iconPositions;
    }, [iconPositions]);

    // Sync jika aboutData berubah (admin: jangan timpa localStorage, visitor: jangan timpa sessionStorage)
    const [prevAboutData, setPrevAboutData] = useState(aboutData);
    if (aboutData !== prevAboutData) {
        setPrevAboutData(aboutData);
        const CLOUDFLARE_D1 = aboutData?.desktopPreferences?.iconPositions;
        if (CLOUDFLARE_D1) {
            let existing: Record<string, DesktopIconPosition> = {};
            if (isAdmin) {
                existing = loadPositions().icons || {};
            } else {
                existing = (loadSessionPositions().icons as Record<string, DesktopIconPosition>) || {};
            }

            // Hanya tambah icon yang belum ada di existing/state
            const merged = { ...iconPositions };
            let hasNew = false;

            Object.entries(CLOUDFLARE_D1).forEach(([id, pos]) => {
                if (!existing?.[id] && !merged[id]) {
                    merged[id] = pos as DesktopIconPosition;
                    hasNew = true;
                }
            });

            if (hasNew) {
                setIconPositions(merged);
            }
        }
    }

    const handleIconPositionChange = useCallback((id: string, x: number, y: number) => {
        // Update state (untuk semua agar responsif)
        const vp = typeof window !== 'undefined'
            ? { width: window.innerWidth, height: window.innerHeight }
            : { width: 1440, height: 900 };

        const updated: DesktopIconPosition = {
            x,
            y,
            xPct: vp.width > 0 ? (x / vp.width) * 100 : 0,
            yPct: vp.height > 0 ? (y / vp.height) * 100 : 0,
            refScreenWidth: vp.width,
            refScreenHeight: vp.height,
        };

        setIconPositions(prev => ({ ...prev, [id]: updated }));

        // Save ke positionSync (localStorage untuk admin, no-op untuk visitor)
        saveIconPosition(id, { x, y }, isAdmin);
    }, [isAdmin]);

    const getIconPos = useCallback((id: string, defaultX: number, defaultY: number) => {
        const saved = iconPositions[id];
        if (saved) return { x: saved.x, y: saved.y };
        return getIconPosition(id, null, { x: defaultX, y: defaultY }, isAdmin);
    }, [iconPositions, isAdmin]);

    // Flush Icons to Server (Admin only)
    const flushIcons = useCallback(async () => {
        if (!isAdmin || !csrfToken) return;
        try {
            const { flushPositions } = await import('../utils/positionSync');
            await flushPositions(csrfToken);
        } catch (error) {
            console.error('[DesktopLayout] Failed to flush icons:', error);
        }
    }, [isAdmin, csrfToken]);

    useEffect(() => {
        registerFlush('desktopIcons', flushIcons);
        return () => unregisterFlush('desktopIcons');
    }, [registerFlush, unregisterFlush, flushIcons]);

    return {
        iconPositions,
        setIconPositions,
        handleIconPositionChange,
        getIconPos
    };
}
