import React from "react";
import { DockPreferences } from "@/types/about";
import AppIcon from "../ui/AppIcon";

interface DockItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isOpen?: boolean;
}

/**
 * Merges default dock items with the user's configuration from the database.
 * This ensures that labels and icons can be customized via the Admin Panel,
 * and these changes are reflected consistently across all pages.
 */
export const getDockItemConfig = (
    defaultItems: DockItem[],
    config?: DockPreferences
): DockItem[] => {
    return defaultItems.filter(item => {
        if (item.id === 'whatsapp') return true; // Always show whatsapp for now to debug
        if (!config) return true;
        const itemConfig = config[item.id];
        return !itemConfig?.isHidden;
    }).map(item => {
        const pref = config?.[item.id];

        let icon = item.icon;
        // If a custom icon URL is set in the config, use it
        if (pref && pref.iconUrl) {
            icon = <AppIcon imageUrl={pref.iconUrl} priority={true} />;
        }

        return {
            ...item,
            label: pref?.label || item.label, // Use custom label if available
            icon
        };
    });
};
