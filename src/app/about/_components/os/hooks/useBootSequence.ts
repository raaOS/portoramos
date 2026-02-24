"use client";

import { useState, useEffect } from "react";
import { soundManager } from "../utils/SoundManager";

export function useBootSequence() {
    const [needsPowerOn, setNeedsPowerOn] = useState(true);
    const [isBooting, setIsBooting] = useState(false);

    const powerOn = () => {
        console.log('[useBootSequence] Powering on, unlocking audio silently...');
        soundManager.unlock(); // Unlock without playing any sound
        soundManager.clearCache('startup'); // Reset so startup plays on each new boot
        setNeedsPowerOn(false);
        setIsBooting(true);
    };

    const finishBooting = () => {
        setIsBooting(false);
    };

    return {
        needsPowerOn,
        isBooting,
        powerOn,
        finishBooting
    };
}
