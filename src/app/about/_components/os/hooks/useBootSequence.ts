"use client";

import { useState, useEffect } from "react";
import { soundManager } from "../utils/SoundManager";

export function useBootSequence() {
    const [isBooting, setIsBooting] = useState(true);

    // Initialize sounds on first interaction
    useEffect(() => {
        const initAudio = () => {
            soundManager.init();
            window.removeEventListener('mousedown', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
        window.addEventListener('mousedown', initAudio);
        window.addEventListener('keydown', initAudio);

        return () => {
            window.removeEventListener('mousedown', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
    }, []);

    const finishBooting = () => {
        setIsBooting(false);
        soundManager.play('startup');
    };

    return {
        isBooting,
        finishBooting
    };
}
