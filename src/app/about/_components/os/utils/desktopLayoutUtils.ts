import { Project } from "@/types/projects";
import { WindowState } from "@/hooks/useWindowManager";
import { NoteData } from "../StickyNoteItem";

export const generateDesktopIcons = (
    windowSize: { width: number; height: number },
    windows: WindowState[],
    notes: NoteData[],
    commercialProjects: Project[],
    desktopPreferences?: { maxIcons?: number },
    handleGoHome?: () => void
) => {
    if (!windowSize.width) return [];

    // 1. Identify "Forbidden Zones" (Obstacles)
    const obstacles: { x: number; y: number; w: number; h: number }[] = [];

    // Add Profile Window ('about') to obstacles to avoid overlap
    windows.filter((w) => w.id === 'about' && w.isOpen && !w.isMinimized).forEach((w) => {
        obstacles.push({
            x: w.initialPosition?.x || 0,
            y: w.initialPosition?.y || 0,
            w: (w.width || 900) + 20, // Add buffer
            h: (w.height || 600) + 20,
        });
    });

    // Add sticky notes to obstacles
    notes.filter((n) => !n.isDeleted).forEach((n) => {
        obstacles.push({
            x: n.x || 100,
            y: n.y || 100,
            w: n.width || 280,
            h: n.height || 280,
        });
    });

    // 2. Define Desktop Grid
    const gridX = 110;
    const gridY = 140;
    const margin = 40;
    const topOffset = 60; // MenuBar
    const bottomOffset = 120; // Dock

    const cols = Math.floor((windowSize.width - margin * 2) / gridX);
    const rows = Math.floor((windowSize.height - topOffset - bottomOffset) / gridY);

    const availableSlots: { x: number; y: number }[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = margin + c * gridX;
            const y = topOffset + margin / 2 + r * gridY;

            // Collision check (Box vs Box)
            const isBlocked = obstacles.some((obs) => {
                const bufferX = 20; // Spacing around windows horizontally
                const bufferY = 20; // Spacing around windows vertically
                return (
                    x + 80 > obs.x - bufferX && // Icon width is approx 80
                    x < obs.x + obs.w + bufferX &&
                    y + 100 > obs.y - bufferY && // Icon height is approx 100
                    y < obs.y + obs.h + bufferY
                );
            });

            if (!isBlocked) {
                availableSlots.push({ x, y });
            }
        }
    }

    // 3. True Random Slot Assignment (Shuffle logic)
    // Fisher-Yates shuffle for true randomness
    for (let i = availableSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    let visibleProjects = commercialProjects.filter((p) => p.status !== "draft");

    if (desktopPreferences?.maxIcons) {
        visibleProjects = visibleProjects.slice(0, desktopPreferences.maxIcons);
    }

    // 4. Combine Projects with specialized shortcuts
    const desktopItems = [
        {
            id: "shortcut-home",
            type: "folder",
            label: "My Projects",
            action: handleGoHome,
        },
        ...visibleProjects.map((p) => ({ ...p, type: "project" })),
    ];

    const generatedIcons = desktopItems.map((item: any, index: number) => {
        const slot =
            availableSlots.length > 0
                ? availableSlots.pop()!
                : {
                    x: windowSize.width - margin - gridX + index * 10,
                    y: windowSize.height - bottomOffset - gridY + index * 10,
                };

        const jitterX = Math.random() * 20 - 10;
        const jitterY = Math.random() * 20 - 10;

        const finalX = Math.max(
            20,
            Math.min(windowSize.width - 100, slot.x + jitterX)
        );
        const finalY = Math.max(
            topOffset,
            Math.min(windowSize.height - bottomOffset, slot.y + jitterY)
        );

        if (item.type === "folder") {
            return {
                id: item.id,
                type: "folder",
                label: item.label,
                x: finalX,
                y: finalY,
                action: item.action,
            };
        }

        const project = item as Project;

        // Video Detection Logic
        let videoUrl: string | undefined;
        // isVideo helper logic duplicated or moved? 
        // We will do simple regex here as in original file
        const isVideo = (url?: string) => url && /\.(mp4|webm|mov)$/i.test(url);

        if (isVideo(project.cover)) {
            videoUrl = project.cover;
        } else if (project.galleryItems?.some((i) => i.kind === "video")) {
            videoUrl = project.galleryItems.find((i) => i.kind === "video")?.src;
        }

        // Calculate aspect ratio from project dimensions, default to 4:5 (portrait poster)
        const aspectRatio = project.coverWidth && project.coverHeight
            ? project.coverWidth / project.coverHeight
            : 0.8; // Default 4:5 portrait

        // Generate poster URL for video (swap .mp4/.webm to .jpg for faster load)
        const posterUrl = videoUrl
            ? videoUrl.replace(/\.(mp4|webm|mov)$/i, '.jpg')
            : project.cover;

        return {
            id: project.id,
            type: "project",
            data: project,
            label: project.title,
            videoUrl: videoUrl,
            imageUrl: posterUrl, // Use poster image for faster initial load
            aspectRatio: aspectRatio,
            x: finalX,
            y: finalY,
        };
    });

    return generatedIcons;
};
