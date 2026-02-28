"use client";

import { useState, useRef } from "react";
import { AboutData } from "@/types/about";

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

    // Sync state with props during render if props changed
    // This avoids useEffect cascading renders
    const [prevAboutData, setPrevAboutData] = useState(aboutData);
    if (aboutData !== prevAboutData) {
        setPrevAboutData(aboutData);
        if (aboutData?.desktopPreferences?.iconPositions && !isPersistingRef.current) {
            setIconPositions(aboutData.desktopPreferences.iconPositions);
        }
    }

    const handleIconPositionChange = (id: string, x: number, y: number) => {
        // 1. Optimistic Update
        const newPositions = { ...iconPositions, [id]: { x, y } };
        setIconPositions(newPositions);

        // 2. Persist if Admin (Debounced)
        if (isAdmin) {
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
