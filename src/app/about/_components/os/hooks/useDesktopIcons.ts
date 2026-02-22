import { useMemo } from "react";
import { generateDesktopIcons } from "../utils/desktopLayoutUtils";
import type { DesktopPreferences, AboutData } from "@/types/about";
import type { Project } from "@/types/projects";
import type { WindowState } from "@/hooks/useWindowManager";

interface UseDesktopIconsProps {
    mounted: boolean;
    windowSize: { width: number; height: number };
    windows: WindowState[];
    notes: any[]; // Use specific type if available, but staying safe for now
    commercialProjects: Project[];
    aboutData: AboutData | null | undefined;
    handleGoHome: () => void;
    iconPositions: Record<string, { x: number; y: number }>;
}

export function useDesktopIcons({
    mounted,
    windowSize,
    windows,
    notes,
    commercialProjects,
    aboutData,
    handleGoHome,
    iconPositions
}: UseDesktopIconsProps) {
    // Optimized Layout: Only trigger reshuffle if "Obstacles" change.
    const obstacleSignature = useMemo(() => {
        // 1. Sticky Notes State (Position & Deletion)
        const notesState = notes
            .filter(n => !n.isDeleted)
            .map(n => `${n.id}:${n.x},${n.y}`)
            .join('|');

        return `static-windows|${notesState}`;
    }, [notes]);

    const projectIcons = useMemo(() => {
        if (!mounted || !commercialProjects.length || !windowSize.width) return [];

        // Merge props prefs with local state overrides
        const mergedPreferences: DesktopPreferences = {
            visibleProjectIds: aboutData?.desktopPreferences?.visibleProjectIds || [],
            maxIcons: aboutData?.desktopPreferences?.maxIcons || 100,
            layout: aboutData?.desktopPreferences?.layout || 'grid',
            iconPositions: iconPositions
        };

        return generateDesktopIcons(
            windowSize,
            windows,
            notes,
            commercialProjects,
            mergedPreferences,
            handleGoHome
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, windowSize.width, windowSize.height, obstacleSignature, commercialProjects, aboutData, handleGoHome, iconPositions]);

    return { projectIcons };
}
