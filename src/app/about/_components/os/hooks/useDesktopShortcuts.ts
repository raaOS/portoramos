"use client";

import { useEffect } from "react";

interface UseDesktopShortcutsProps {
    showSpotlight: boolean;
    setShowSpotlight: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useDesktopShortcuts({ showSpotlight, setShowSpotlight }: UseDesktopShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for Spotlight
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSpotlight(prev => !prev);
            }
            // Esc to close Spotlight
            if (e.key === 'Escape' && showSpotlight) {
                setShowSpotlight(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSpotlight, setShowSpotlight]);
}
