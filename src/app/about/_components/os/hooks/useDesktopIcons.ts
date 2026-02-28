import { useMemo, useState, useEffect } from "react";
import { generateDesktopIcons } from "../utils/desktopLayoutUtils";
import type { DesktopPreferences, AboutData } from "@/types/about";
import type { Project } from "@/types/projects";

interface UseDesktopIconsProps {
    mounted: boolean;
    commercialProjects: Project[];
    aboutData: AboutData | null | undefined;
    handleGoHome: () => void;
    iconPositions: Record<string, { x: number; y: number }>;
}

export function useDesktopIcons({
    mounted,
    commercialProjects,
    aboutData,
    handleGoHome,
    iconPositions
}: UseDesktopIconsProps) {
    // Internal window size state
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateSize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

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
