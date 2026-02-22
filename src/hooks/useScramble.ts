'use client';

import { useState, useEffect, useCallback } from 'react';

const CHARS = 'ABCDEF123456!@#$%^&*()_+<>?:{}|[]';

/**
 * useScramble Hook
 * Handles the logic of scrambling text for a high-security visual effect.
 */
export function useScramble(text: string, duration: number = 800, active: boolean = true) {
    const [scrambledText, setScrambledText] = useState(text);
    const [isComplete, setIsComplete] = useState(!active);

    const getRandomChar = useCallback(() => {
        return CHARS[Math.floor(Math.random() * CHARS.length)];
    }, []);

    useEffect(() => {
        if (!active) return;

        let iteration = 0;
        const maxIterations = 10;
        const intervalTime = duration / maxIterations;

        const interval = setInterval(() => {
            setScrambledText(
                text
                    .split('')
                    .map((char, index) => {
                        if (char === ' ' || char === '\n') return char;
                        if (iteration > (maxIterations / text.length) * index) {
                            return text[index];
                        }
                        return getRandomChar();
                    })
                    .join('')
            );

            iteration += 1;

            if (iteration >= maxIterations) {
                setScrambledText(text);
                setIsComplete(true);
                clearInterval(interval);
            }
        }, intervalTime);

        return () => clearInterval(interval);
    }, [text, duration, active, getRandomChar]);

    return { scrambledText, isComplete };
}
