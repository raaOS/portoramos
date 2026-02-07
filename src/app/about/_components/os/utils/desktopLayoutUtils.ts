import { Project } from "@/types/projects";
import { WindowState } from "@/hooks/useWindowManager";
import { NoteData } from "../StickyNoteItem";
import { getProxiedUrl } from "@/lib/utils";
import { DesktopPreferences } from "@/types/about";

export const generateDesktopIcons = (
    windowSize: { width: number; height: number },
    windows: WindowState[],
    notes: NoteData[],
    commercialProjects: Project[],
    desktopPreferences?: DesktopPreferences,
    handleGoHome?: () => void
) => {
    if (!windowSize.width) return [];

    // 1. Identify "Forbidden Zones" (Obstacles)
    const obstacles: { x: number; y: number; w: number; h: number }[] = [];

    // Windows are NO LONGER obstacles (Windows-style static icons)

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
    const isMobile = windowSize.width < 768;
    const gridX = isMobile ? 90 : 110; // Tighter grid on mobile
    const gridY = isMobile ? 120 : 140; // Tighter grid on mobile
    const margin = isMobile ? 20 : 40; // Smaller margin on mobile
    const topOffset = 60; // MenuBar
    const bottomOffset = 120; // Dock

    const cols = Math.floor((windowSize.width - margin * 2) / gridX);
    const rows = Math.floor((windowSize.height - topOffset - bottomOffset) / gridY);

    const availableSlots: { x: number; y: number }[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = margin + c * gridX;
            const y = topOffset + margin / 2 + r * gridY;

            // Collision check (Box vs Box) -> Skip on Mobile (width < 768) to ensure icons render even if window covers screen
            // On mobile, screen real estate is scarce, so we prize grid structure over avoiding overlap with a window that can be closed.
            const isBlocked = !isMobile && obstacles.some((obs) => {
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

    // 3. Stable Slot Assignment (No Random Shuffle)
    // We sort available slots by position (top-to-bottom, left-to-right)
    // but we use item IDs to consistently pick a slot.
    availableSlots.sort((a, b) => a.y - b.y || a.x - b.x);

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
        // 1. Check if we have a saved position for this ID (Admin Saved)
        const savedPos = desktopPreferences?.iconPositions?.[item.id];

        let slotIndex, slot, finalX, finalY;

        if (savedPos) {
            // USE SAVED POSITION (Override Grid)
            finalX = savedPos.x;
            finalY = savedPos.y;
        } else {
            // FALLBACK TO GRID
            slotIndex = index % Math.max(1, availableSlots.length);
            slot = availableSlots.length > 0
                ? availableSlots[slotIndex] // STABLE PICK
                : {
                    x: windowSize.width - margin - gridX + index * 10,
                    y: windowSize.height - bottomOffset - gridY + index * 10,
                };

            // Static jitter based on ID (to avoid moving icons but keep organic look)
            const getSeededRandom = (id: string) => {
                let hash = 0;
                for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
                return (hash % 100) / 100;
            };

            const seed = getSeededRandom(item.id);
            const jitterRange = isMobile ? 5 : 20;
            const jitterX = seed * jitterRange - (jitterRange / 2);
            const jitterY = (1 - seed) * jitterRange - (jitterRange / 2);

            finalX = Math.max(
                10,
                Math.min(windowSize.width - 80, slot.x + jitterX)
            );
            finalY = Math.max(
                topOffset,
                Math.min(windowSize.height - bottomOffset, slot.y + jitterY)
            );
        }

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
            ? getProxiedUrl(videoUrl.replace(/\.(mp4|webm|mov)$/i, '.jpg'))
            : getProxiedUrl(project.cover);

        return {
            id: project.id,
            type: "project",
            data: project,
            label: project.title,
            videoUrl: videoUrl ? getProxiedUrl(videoUrl) : undefined,
            imageUrl: posterUrl, // Use poster image for faster initial load
            aspectRatio: aspectRatio,
            x: finalX,
            y: finalY,
            priority: index < 4 // Prioritize the first 4 icons for LCP
        };
    });

    // Ensure the first few folders also get priority if they are at the top
    const optimizedIcons = generatedIcons.map((icon, idx) => ({
        ...icon,
        priority: idx < 4
    }));

    return optimizedIcons;
};
