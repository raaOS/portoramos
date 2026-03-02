"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { soundManager } from "../utils/SoundManager";

interface StartScreenProps {
    onStart: () => void;
    isActive: boolean;
}

type ScreenState = "idle" | "zooming" | "showingText" | "glassReveal" | "done";

// Boot Configuration - 5.0 seconds total, relaxed and smooth pace
const BOOT_CONFIG = {
    keyholeZoomDuration: 2000, // 2.0s zoom
    textFadeInDuration: 1000, // 1.0s text fade in
    textDisplayDuration: 2000, // 2.0s text stay
    totalDuration: 5000, // 5.0 seconds total duration
    allowSkip: true,
} as const;

const StartScreen = ({ onStart, isActive }: StartScreenProps) => {
    const [screenState, setScreenState] = useState<ScreenState>("idle");
    const handleClick = useCallback(() => {
        if (screenState !== "idle") return;

        // Start the boot sequence
        setScreenState("zooming");

        // Play startup sound immediately when zoom starts
        soundManager.play("startup");

        // After zoom completes (slightly overlapped so it doesn't blink empty green)
        setTimeout(() => {
            setScreenState("showingText");
        }, BOOT_CONFIG.keyholeZoomDuration - 200);

        // After text display, start hiding background
        setTimeout(() => {
            setScreenState("glassReveal");
        }, BOOT_CONFIG.keyholeZoomDuration + BOOT_CONFIG.textDisplayDuration - 200);

        // Complete
        // Added the new 2.5s duration to the total config time so the screen doesn't unmount early
        setTimeout(() => {
            setScreenState("done");
            onStart();
        }, BOOT_CONFIG.keyholeZoomDuration + BOOT_CONFIG.textDisplayDuration + 2500 - 400);
    }, [screenState, onStart]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                if (screenState === "idle") {
                    handleClick();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [screenState, handleClick]);

    if (!isActive || screenState === "done") {
        return null;
    }

    return (
        <m.div
            className="fixed inset-0 z-[10000] overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }} // NEVER fade out the main container. The hole creates the reveal.
            style={{ pointerEvents: screenState === "glassReveal" ? "none" : "auto" }}
        >
            {/* Stage 3 & 4: Deep Dive Background Reveal (Hollow 'O') */}
            <m.div
                className="absolute inset-0 z-[10002] pointer-events-none overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: (screenState === "showingText" || screenState === "glassReveal") ? 1 : 0,
                    scale: screenState === "glassReveal" ? 100 : 1
                }}
                transition={{
                    opacity: { duration: 0.8, ease: "easeInOut" },
                    scale: {
                        duration: screenState === "glassReveal" ? 2.5 : 0.6, // Phase 3 Deep Dive extended to 2.5s
                        ease: [0.76, 0, 0.24, 1]
                    }
                }}
                style={{
                    transformOrigin: "50% 50%" // Centered exactly on our target 'O' (50, 50)
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid slice"
                    className="w-full h-full"
                >
                    <defs>
                        <mask id="hollow-o-mask">
                            {/* Everything in white is shown (the green background) */}
                            <rect x="0" y="0" width="100" height="100" fill="white" />
                            {/* The 'O' hole in RAMOS - 100% Mathematically Perfect Circle Portal */}
                            {/* Radius reduced to 2.23125 to match the new 0.6 scale of the text group */}
                            <circle cx="50" cy="50" r="2.23125" fill="black" />
                        </mask>
                    </defs>

                    {/* Stage 3: The Neon Green Background (Full Screen again!) */}
                    <rect
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        fill="#5eff15"
                        mask="url(#hollow-o-mask)"
                    />

                    {/* The text "RAMOS OS" - Hybrid Design (DM Sans Paths + Perfect Circles) */}
                    {/* Simplified to only handle opacity fade-in to prevent conflicting with the parent's scale zoom-out */}
                    <m.g
                        fill="black"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/*
                            Coordinate Mapping to center on the 'O' portal at (50, 50).
                            Scale dropped to 0.6 to match ~90px text requirement.
                        */}
                        <g transform="translate(50, 50) scale(0.6) translate(-31.056, -4.345)">
                            {/* R (DM Sans) */}
                            <path d="M 1.8 8.545 L 0 8.545 L 0 0.145 L 3.264 0.145 Q 4.284 0.145 4.962 0.499 Q 5.64 0.853 5.97 1.441 Q 6.3 2.029 6.3 2.749 Q 6.3 3.421 5.982 4.009 Q 5.664 4.597 4.992 4.957 Q 4.32 5.317 3.252 5.317 L 1.8 5.317 L 1.8 8.545 Z M 1.8 1.645 L 1.8 4.021 L 3.156 4.021 Q 3.828 4.021 4.146 3.697 Q 4.464 3.373 4.464 2.821 Q 4.464 2.281 4.146 1.963 Q 3.828 1.645 3.156 1.645 L 1.8 1.645 Z M 6.372 8.545 L 4.332 8.545 L 2.64 4.873 L 4.572 4.873 L 6.372 8.545 Z" />
                            {/* A (DM Sans) - Repositioned closer after O scale down */}
                            <path transform="translate(-0.3, 0)" d="M 9.012 8.545 L 7.128 8.545 L 10.188 0.145 L 12.252 0.145 L 15.312 8.545 L 13.404 8.545 L 11.208 2.173 L 9.012 8.545 Z M 13.812 6.709 L 8.46 6.709 L 8.94 5.317 L 13.344 5.317 L 13.812 6.709 Z" />
                            {/* M (DM Sans) - Repositioned closer after O scale down */}
                            <path transform="translate(-0.6, 0)" d="M 18.156 8.545 L 16.356 8.545 L 16.356 0.145 L 18.516 0.145 L 20.964 5.197 L 23.388 0.145 L 25.536 0.145 L 25.536 8.545 L 23.736 8.545 L 23.736 3.181 L 21.672 7.369 L 20.232 7.369 L 18.156 3.181 L 18.156 8.545 Z" />

                            {/* O (The Portal) - Scaled down to match cap height, maintaining exact stroke thickness (1.65) */}
                            <circle cx="31.056" cy="4.345" r="3.8" fill="none" stroke="black" strokeWidth="1.65" />

                            {/* S (DM Sans) - Repositioned closer after O scale down */}
                            <path transform="translate(0.6, 0)" d="M 36.3 6.001 L 38.22 6.001 Q 38.232 6.349 38.4 6.613 Q 38.568 6.877 38.856 7.027 Q 39.144 7.177 39.528 7.177 Q 39.852 7.177 40.098 7.075 Q 40.344 6.973 40.488 6.775 Q 40.632 6.577 40.632 6.277 Q 40.632 5.965 40.464 5.743 Q 40.296 5.521 40.008 5.359 Q 39.72 5.197 39.342 5.059 Q 38.964 4.921 38.532 4.789 Q 37.536 4.465 37.002 3.913 Q 36.468 3.361 36.468 2.437 Q 36.468 1.669 36.846 1.123 Q 37.224 0.577 37.884 0.289 Q 38.544 0.001 39.384 0.001 Q 40.248 0.001 40.902 0.295 Q 41.556 0.589 41.946 1.147 Q 42.336 1.705 42.36 2.473 L 40.428 2.473 Q 40.416 2.209 40.278 1.993 Q 40.14 1.777 39.906 1.645 Q 39.672 1.513 39.36 1.513 Q 39.084 1.501 38.856 1.591 Q 38.628 1.681 38.496 1.867 Q 38.364 2.053 38.364 2.329 Q 38.364 2.593 38.502 2.791 Q 38.64 2.989 38.886 3.127 Q 39.132 3.265 39.462 3.385 Q 39.792 3.505 40.188 3.625 Q 40.824 3.841 41.358 4.135 Q 41.892 4.429 42.222 4.903 Q 42.552 5.377 42.552 6.157 Q 42.552 6.841 42.198 7.417 Q 41.844 7.993 41.178 8.341 Q 40.512 8.689 39.528 8.689 Q 38.628 8.689 37.902 8.383 Q 37.176 8.077 36.756 7.477 Q 36.336 6.877 36.3 6.001 Z" />

                            {/* OS part - Shifted for breathing room */}
                            <g transform="translate(1.1, 0)">
                                {/* Custom 'O' matching RAMOS precisely (No mask effect here) */}
                                <circle cx="50.532" cy="4.345" r="3.8" fill="none" stroke="black" strokeWidth="1.65" />
                                {/* S (DM Sans - Part 2) */}
                                <path d="M 55.776 6.001 L 57.696 6.001 Q 57.708 6.349 57.876 6.613 Q 58.044 6.877 58.332 7.027 Q 58.62 7.177 59.004 7.177 Q 59.328 7.177 59.574 7.075 Q 59.82 6.973 59.964 6.775 Q 60.108 6.577 60.108 6.277 Q 60.108 5.965 59.94 5.743 Q 59.772 5.521 59.484 5.359 Q 59.196 5.197 58.818 5.059 Q 58.44 4.921 58.008 4.789 Q 57.012 4.465 56.478 3.913 Q 55.944 3.361 55.944 2.437 Q 55.944 1.669 56.322 1.123 Q 56.7 0.577 57.36 0.289 Q 58.02 0.001 58.86 0.001 Q 59.724 0.001 60.378 0.295 Q 61.032 0.589 61.422 1.147 Q 61.812 1.705 61.836 2.473 L 59.904 2.473 Q 59.892 2.209 59.754 1.993 Q 59.616 1.777 59.382 1.645 Q 59.148 1.513 58.836 1.513 Q 58.56 1.501 58.332 1.591 Q 58.104 1.681 57.972 1.867 Q 57.84 2.053 57.84 2.329 Q 57.84 2.593 57.978 2.791 Q 58.116 2.989 58.362 3.127 Q 58.608 3.265 58.938 3.385 Q 59.268 3.505 59.664 3.625 Q 60.3 3.841 60.834 4.135 Q 61.368 4.429 61.698 4.903 Q 62.028 5.377 62.028 6.157 Q 62.028 6.841 61.674 7.417 Q 61.32 7.993 60.654 8.341 Q 59.988 8.689 59.004 8.689 Q 58.104 8.689 57.378 8.383 Q 56.652 8.077 56.232 7.477 Q 55.812 6.877 55.776 6.001 Z" />
                            </g>
                        </g>
                    </m.g>
                </svg>
            </m.div>

            {/* Stage 1 & 2 & 3: Master Solid Frame */}
            {/* Starts black for keyhole, turns Neon Green exactly when RAMOS OS appears, 
                then INSTANTLY DISAPPEARS during glassReveal (opacity 0 duration 0) so the expanding 
                green SVG hole cleanly reveals the desktop beneath without black flashes. */}
            <m.div
                className="absolute inset-0 z-[10000]"
                animate={{
                    opacity: (screenState === "idle" || screenState === "zooming" || screenState === "showingText") ? 1 : 0,
                    backgroundColor: (screenState === "showingText") ? "#5eff15" : "#000000"
                }}
                transition={{
                    opacity: { duration: screenState === "glassReveal" ? 0 : 0.8, ease: "easeInOut" },
                    backgroundColor: { duration: 0 } // Switch instantly behind the text mask
                }}
            />

            {/* Stage 1 & 2: Keyhole */}
            <m.div
                className="absolute inset-0 flex items-center justify-center z-[10001]"
                style={{ pointerEvents: screenState === "idle" ? "auto" : "none" }}
                onClick={screenState === "idle" ? handleClick : undefined}
                animate={{
                    opacity: (screenState === "idle" || screenState === "zooming") ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }} // Smoothly fade out as RAMOS OS fades in (crossfade)
            >
                <m.div
                    className="relative flex items-center justify-center cursor-pointer"
                    initial={{ scale: 1 }}
                    animate={{
                        // Keep it scaled up once zooming starts so it doesn't "shrink" back 
                        // when the state changes to showingText/glassReveal.
                        scale: (screenState === "idle") ? 1 : 300
                    }}
                    transition={{
                        duration: BOOT_CONFIG.keyholeZoomDuration / 1000,
                        ease: [0.76, 0, 0.24, 1]
                    }}
                >
                    <m.div
                        className="relative flex items-center justify-center text-[#5eff15]"
                        whileHover={screenState === "idle" ? {
                            filter: "drop-shadow(0 0 60px rgba(94, 255, 21, 0.8)) drop-shadow(0 0 20px rgba(94, 255, 21, 0.5))",
                            scale: 1.05
                        } : {
                            filter: "drop-shadow(0 0 0px rgba(94, 255, 21, 0))",
                            scale: 1
                        }}
                        animate={{
                            filter: screenState === "idle" ? "drop-shadow(0 0 0px rgba(94, 255, 21, 0))" : "none",
                            scale: 1
                        }}
                        transition={{ duration: screenState === "idle" ? 0.3 : 0 }}
                    >
                        <svg
                            width="80"
                            height="120"
                            viewBox="0 0 24 36"
                            fill="currentColor"
                        >
                            <circle cx="12" cy="10" r="9" />
                            <path d="M8 16 L4 32 C 3 35, 21 35, 20 32 L16 16 Z" />
                        </svg>
                    </m.div>

                    {screenState === "idle" && (
                        <m.p
                            className="absolute -bottom-20 text-[#5eff15] text-sm tracking-[0.3em] uppercase whitespace-nowrap font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 0.5 }}
                        >
                            Click or Press Space
                        </m.p>
                    )}
                </m.div>
            </m.div>

            {/* Stage 3: RamosOS Text replaced by SVG Reveal above */}
        </m.div>
    );
};

export default StartScreen;
