"use client";

import { useState, useEffect, useRef } from "react";
import { AboutData } from "@/types/about";

interface UseDesktopLayoutProps {
    aboutData?: AboutData | null;
    isAdmin: boolean;
    csrfToken: string | null;
}

export function useDesktopLayout({ aboutData, isAdmin, csrfToken }: UseDesktopLayoutProps) {
    // Local state for icon positions (Optimistic UI)
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({});
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize from props
    useEffect(() => {
        if (aboutData?.desktopPreferences?.iconPositions) {
            setIconPositions(aboutData.desktopPreferences.iconPositions);
        }
    }, [aboutData]);

    const handleIconPositionChange = (id: string, x: number, y: number) => {
        // 1. Optimistic Update
        const newPositions = { ...iconPositions, [id]: { x, y } };
        setIconPositions(newPositions);

        // 2. Persist if Admin (Debounced)
        if (isAdmin) {
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
