"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AboutData } from "@/types/about";
import { getIconPosition, saveIconPosition, loadPositions, loadSessionPositions } from "../utils/positionSync";
import { useLayoutPersistence } from "../contexts/LayoutPersistenceContext";

interface UseDesktopLayoutProps {
    aboutData?: AboutData | null;
    isAdmin: boolean;
    csrfToken: string | null;
}

export function useDesktopLayout({ aboutData, isAdmin, csrfToken }: UseDesktopLayoutProps) {
    const { registerFlush, unregisterFlush } = useLayoutPersistence();

    // Load dari positionSync (localStorage untuk admin, Firebase/default untuk visitor)
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
        const firebase = aboutData?.desktopPreferences?.iconPositions || {};
        
        if (isAdmin) {
            // Admin: localStorage menimpa Firebase (buffer sesi)
            const local = loadPositions().icons || {};
            return { ...firebase, ...local };
        } else {
            // Visitor: Murni Firebase (Admin's template) - Reset on refresh
            return firebase;
        }
    });

    // Ref to track latest iconPositions without adding to dependency array
    const iconPositionsRef = React.useRef(iconPositions);
    iconPositionsRef.current = iconPositions;

    // Sync jika aboutData berubah (admin: jangan timpa localStorage, visitor: jangan timpa sessionStorage)
    useEffect(() => {
        const firebase = aboutData?.desktopPreferences?.iconPositions;
        if (!firebase) return;
        
        let existing: Record<string, { x: number; y: number }> = {};
        if (isAdmin) {
            existing = loadPositions().icons || {};
        } else {
            existing = loadSessionPositions().icons || {};
        }
        
        // Hanya tambah icon yang belum ada di existing/state
        // Use ref to access latest state without dependency
        const merged = { ...iconPositionsRef.current };
        let hasNew = false;
        
        Object.entries(firebase).forEach(([id, pos]) => {
            if (!existing?.[id] && !merged[id]) {
                merged[id] = pos as { x: number; y: number };
                hasNew = true;
            }
        });
        
        if (hasNew) {
            setIconPositions(merged);
        }
    }, [aboutData, isAdmin]);

    const handleIconPositionChange = useCallback((id: string, x: number, y: number) => {
        // Update state (untuk semua agar responsif)
        setIconPositions(prev => ({ ...prev, [id]: { x, y } }));
        
        // Save ke positionSync (localStorage untuk admin, sessionStorage untuk visitor)
        saveIconPosition(id, { x, y }, isAdmin);
    }, [isAdmin]);

    const getIconPos = useCallback((id: string, defaultX: number, defaultY: number) => {
        return iconPositions[id] || getIconPosition(id, null, { x: defaultX, y: defaultY }, isAdmin);
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
