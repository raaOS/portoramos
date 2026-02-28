"use client";

import { useEffect } from "react";
import { soundManager } from "../utils/SoundManager";

interface BootSequenceProps {
    onComplete: () => void;
    skipAnimation?: boolean;
}

const BootSequence = ({ onComplete, skipAnimation = false }: BootSequenceProps) => {
    useEffect(() => {
        if (skipAnimation) {
            onComplete();
            return;
        }

        // Play startup sound
        soundManager.play("startup");

        // Complete immediately
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 100);

        return () => {
            clearTimeout(completeTimer);
        };
    }, [onComplete, skipAnimation]);

    // No visual - just sound and immediate complete
    return null;
};

export default BootSequence;
