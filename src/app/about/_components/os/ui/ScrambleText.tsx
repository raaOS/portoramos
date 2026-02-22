'use client';

import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useScramble } from '../hooks/useScramble';
import { Shield } from 'lucide-react';

interface ScrambleTextProps {
    text: string;
    active?: boolean;
    onComplete?: () => void;
}

/**
 * ScrambleText Component
 * Renders text with a scrambling animation and a subtle shield indicator during "encryption".
 */
export default function ScrambleText({ text, active = true, onComplete }: ScrambleTextProps) {
    const { scrambledText, isComplete } = useScramble(text, 1000, active);

    React.useEffect(() => {
        if (isComplete && onComplete) {
            onComplete();
        }
    }, [isComplete, onComplete]);

    return (
        <span className="relative inline-block min-h-[1em]">
            <AnimatePresence mode="wait">
                {!isComplete ? (
                    <m.span
                        key="scrambling"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: 'blur(4px)' }}
                        className="font-mono text-xs opacity-80 flex items-center gap-1.5"
                    >
                        <Shield size={12} className="animate-pulse text-violet-500" />
                        {scrambledText}
                    </m.span>
                ) : (
                    <m.span
                        key="original"
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="transition-colors duration-500"
                    >
                        {text}
                    </m.span>
                )}
            </AnimatePresence>
        </span>
    );
}
