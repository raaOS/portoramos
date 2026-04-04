"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AboutData } from "@/types/about";
import { useSystemSound } from "@/hooks/useSystemSound";
import { useLayoutPersistence } from "@/app/about/_components/os/contexts/LayoutPersistenceContext";
import { useUnifiedZIndex } from "@/app/about/_components/os/context/UnifiedZIndexContext";
import { WindowState } from "./window-manager/types";

// Subhooks
import { useWindowDimensions } from "./window-manager/useWindowDimensions";
import { useWindowPersistence } from "./window-manager/useWindowPersistence";
import { useWindowInitialization } from "./window-manager/useWindowInitialization";
import { useWindowActions } from "./window-manager/useWindowActions";

export type { WindowState };

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

    // 1. Diagnostics & Dimensions
    const { getCenterPosition, getCenterPositionStatic } = useWindowDimensions();

    // 2. Server Persistence & Position Saving
    const { saveWindowPreference, flushWindowPositions } = useWindowPersistence({ aboutData, csrfToken, isAdmin });

    // 3. Initialization
    useWindowInitialization({ initialWindows, aboutData, setWindows, getCenterPositionStatic });

    // Cleanup bouncing doc
    useEffect(() => {
        if (!bouncingDocId) return;
        const timer = setTimeout(() => setBouncingDocId(null), 2000);
        return () => clearTimeout(timer);
    }, [bouncingDocId]);

    // 4. Window Actions
    const windowActions = useWindowActions({
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
    });

    // 5. Layout flush registration
    const { registerFlush, unregisterFlush } = useLayoutPersistence();

    useEffect(() => {
        registerFlush('windowPositions', flushWindowPositions);
        return () => unregisterFlush('windowPositions');
    }, [flushWindowPositions, registerFlush, unregisterFlush]);

    // Request next z-index
    const requestNextZIndex = useCallback((id?: string) => {
        const elementId = id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        return bringToFrontZIndex(elementId, 'window');
    }, [bringToFrontZIndex]);

    return {
        windows,
        setWindows,
        requestNextZIndex,
        bouncingDocId,
        ...windowActions
    };
};
