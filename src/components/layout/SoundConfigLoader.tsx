"use client";

import { useEffect } from "react";
import { soundManager } from "@/components/os/utils/SoundManager";

interface SoundConfigLoaderProps {
    soundConfig?: Record<string, { path: string; volume: number }> | null;
}

/**
 * Global Sound Config Loader
 * Placed in the root layout to ensure soundManager is configured with
 * the correct custom sound paths on every page, not just the main OS page.
 */
export default function SoundConfigLoader({ soundConfig }: SoundConfigLoaderProps) {
    useEffect(() => {
        if (soundConfig) {
            soundManager.loadConfig(soundConfig);
        }
    }, [soundConfig]);

    return null;
}
