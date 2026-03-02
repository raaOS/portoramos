"use client";

import { useState, useCallback } from "react";
import { soundManager } from "../utils/SoundManager";

interface BootSequenceConfig {
    totalDuration: number;
    allowSkip: boolean;
}

const DEFAULT_CONFIG: BootSequenceConfig = {
    totalDuration: 3500, // 3.5 seconds
    allowSkip: true
};

export function useBootSequence(config: Partial<BootSequenceConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const [needsPowerOn, setNeedsPowerOn] = useState(true);
    const [isBooting, setIsBooting] = useState(false);

    const powerOn = useCallback(() => {
        console.log('[useBootSequence] Powering on, unlocking audio silently...');
        soundManager.unlock(); // Unlock audio context
        soundManager.clearCache('startup'); // Reset startup sound for fresh boot
        setNeedsPowerOn(false);
        setIsBooting(true);
    }, []);

    const finishBooting = useCallback(() => {
        setNeedsPowerOn(false); // Ensure needsPowerOn is false
        setIsBooting(false);
    }, []);

    const skipBoot = useCallback(() => {
        if (!finalConfig.allowSkip) return;

        console.log('[useBootSequence] Skipping boot sequence');
        setNeedsPowerOn(false);
        setIsBooting(false);
    }, [finalConfig.allowSkip]);

    return {
        needsPowerOn,
        isBooting,
        powerOn,
        finishBooting,
        skipBoot,
        config: finalConfig
    };
}
