"use client";

export interface DockTarget {
    dockId: string;
    x: number;
    y: number;
}

const WINDOW_TO_DOCK_ID: Record<string, string> = {
    about: "about",
    whatsapp: "whatsapp",
    "trash-bin": "trash",
    projects: "projects",
};

export function getDockIdForWindow(windowId: string): string | null {
    return WINDOW_TO_DOCK_ID[windowId] ?? null;
}

export function resolveDockTarget(windowId: string): DockTarget | null {
    if (typeof document === "undefined") return null;

    const dockId = getDockIdForWindow(windowId);
    if (!dockId) return null;

    const element = document.getElementById(`dock-item-${dockId}`);
    if (!element) return null;

    const rect = element.getBoundingClientRect();

    return {
        dockId,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

export function getTransformOrigin(
    frame: { x: number; y: number; width: number; height: number },
    target: DockTarget | null,
    fallback: string
): string {
    if (!target) return fallback;

    const originX = Math.round(target.x - frame.x);
    const originY = Math.round(target.y - frame.y);

    return `${originX}px ${originY}px`;
}
