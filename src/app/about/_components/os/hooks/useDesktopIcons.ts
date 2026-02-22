import { useMemo } from "react";
import { generateDesktopIcons } from "../utils/desktopLayoutUtils";
import type { DesktopPreferences, AboutData } from "@/types/about";
import type { Project } from "@/types/projects";
import type { WindowState } from "@/hooks/useWindowManager";

interface UseDesktopIconsProps {
    mounted: boolean;
    windowSize: { width: number; height: number };
    commercialProjects: Project[];
    aboutData: AboutData | null | undefined;
    handleGoHome: () => void;
    iconPositions: Record<string, { x: number; y: number }>;
}

export function useDesktopIcons({
    mounted,
    windowSize,
    commercialProjects,
    aboutData,
    handleGoHome,
    iconPositions
}: UseDesktopIconsProps) {

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
            commercialProjects,
            mergedPreferences,
            handleGoHome
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, windowSize.width, windowSize.height, commercialProjects, aboutData, handleGoHome, iconPositions]);

    return { projectIcons };
}
