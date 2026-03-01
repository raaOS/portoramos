"use client";

import React, { useState } from "react";
import { m, AnimatePresence } from "framer-motion";

interface StartScreenProps {
    onStart: () => void;
    isActive: boolean;
}

type ScreenState = "idle" | "showingText" | "glassReveal" | "done";

const StartScreen = ({ onStart, isActive }: StartScreenProps) => {
    const [screenState, setScreenState] = useState<ScreenState>("idle");
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        if (screenState !== "idle") return;

        setIsClicked(true);

        // Quick zoom animation from Keyhole then transition to text
        setTimeout(() => {
            setScreenState("showingText");
        }, 800);

        // Text fades out, Glass clears to reveal desktop
        // (4200 - 1000 = 3200)
        setTimeout(() => {
            setScreenState("glassReveal");
        }, 3200);

        // Complete the start sequence and reveal Desktop entirely
        // 3200 + 1500 (Glass animation) = 4700
        setTimeout(() => {
            setScreenState("done");
            onStart();
        }, 4700);
    };

    if (!isActive || screenState === "done") {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-transparent overflow-hidden">
            {/* 
              The Master Background (The Glass Reveal):
              A sleek cinematic transition from solid black to solid white, 
              then beautifully clears up a heavy frosted-glass blur to reveal the desktop.
            */}
            <m.div
                className="absolute inset-0 pointer-events-none"
                initial={{
                    backgroundColor: "rgba(0, 0, 0, 1)",
                    backdropFilter: "blur(0px)",
                    WebkitBackdropFilter: "blur(0px)",
                }}
                animate={
                    screenState === "idle"
                        // Electric Blue background for Scene 1
                        ? {
                            backgroundColor: "rgba(0, 17, 228, 1)", // #0011e4
                            backdropFilter: "blur(0px)",
                            WebkitBackdropFilter: "blur(0px)",
                        }
                        : screenState === "showingText"
                            // Transition to Neon Green while RamosOS text fades in
                            // Preparing the heavy blur underneath so it's ready to reveal
                            ? {
                                backgroundColor: "rgba(94, 255, 21, 1)", // #5eff15
                                backdropFilter: "blur(50px)",
                                WebkitBackdropFilter: "blur(50px)",
                            }
                            // Clear the glass! Fade out the white frost and drop the blur to 0px
                            : { // glassReveal
                                backgroundColor: "rgba(255, 255, 255, 0)",
                                backdropFilter: "blur(0px)",
                                WebkitBackdropFilter: "blur(0px)",
                            }
                }
                transition={
                    screenState === "glassReveal"
                        // Smoothly fade frost and clear the blur like wiping condensation
                        ? { duration: 1.5, ease: "easeInOut" }
                        // Snap immediately from black to white so there is no gray fade when Keyhole unmounts
                        : { duration: 0 }
                }
            />

            <AnimatePresence>
                {/* === STAGE 1: Power Button (The Keyhole) === */}
                {screenState === "idle" && (
                    <m.div
                        key="power-button"
                        className="absolute inset-0 flex items-center justify-center cursor-pointer z-[10001]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleClick}
                    >
                        <m.div
                            className="relative flex items-center justify-center"
                            // Massive scale-up without fading out so it stays solid white
                            animate={isClicked ? { scale: 150, opacity: 1 } : { scale: 1, opacity: 1 }}
                            transition={
                                isClicked
                                    ? { duration: 0.8, ease: "circIn" }
                                    : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                            }
                        >
                            {/* Keyhole Silhouette (Neon Green) */}
                            <div className="relative flex items-center justify-center text-[#5eff15]">
                                <svg width="60" height="90" viewBox="0 0 24 36" fill="currentColor">
                                    <circle cx="12" cy="12" r="8" />
                                    <path d="M10 18 L6 30 C 5 33, 19 33, 18 30 L14 18 Z" />
                                </svg>
                            </div>

                            {/* Hidden Text (Neon Green) */}
                            {!isClicked && (
                                <p className="absolute -bottom-16 text-[#5eff15] opacity-50 text-xs tracking-[0.4em] uppercase whitespace-nowrap">
                                    Unlock OS
                                </p>
                            )}
                        </m.div>
                    </m.div>
                )}

                {/* === STAGE 2: RamosOS Text Intro === */}
                {screenState === "showingText" && (
                    <m.div
                        key="ramos-text-glass"
                        className="absolute inset-0 flex items-center justify-center z-[10002] pointer-events-none"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        // Smooth exit right before the cinematic iris cuts through
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8, ease: "easeIn" } }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <span className="text-black text-4xl md:text-6xl font-sans flex items-baseline drop-shadow-md">
                            <span className="font-thin uppercase tracking-[0.2em]">Ramos</span>
                            <span className="font-black uppercase tracking-tighter">os</span>
                        </span>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StartScreen;
