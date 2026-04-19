"use client";

import { useEffect } from "react";
import { useOSSystem } from "../context/OSSystemContext";

export function useDesktopShortcuts() {
    const { showSpotlight, setShowSpotlight, toggleSpotlight } = useOSSystem();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for Spotlight
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleSpotlight();
            }
            // Esc to close Spotlight
            if (e.key === 'Escape' && showSpotlight) {
                setShowSpotlight(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSpotlight, setShowSpotlight, toggleSpotlight]);
}
