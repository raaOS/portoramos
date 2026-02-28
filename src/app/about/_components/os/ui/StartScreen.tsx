"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";

interface StartScreenProps {
    onStart: () => void;
    isActive: boolean;
}

type ScreenState = "idle" | "showingText" | "doorsOpening" | "done";

const StartScreen = ({ onStart, isActive }: StartScreenProps) => {
    const [screenState, setScreenState] = useState<ScreenState>("idle");

    const handleClick = () => {
        if (screenState !== "idle") return;
        
        // Step 1: Show RamosOS text (1.5 detik)
        setScreenState("showingText");
        
        // Step 2: Doors opening animation (1.5 detik setelah teks)
        setTimeout(() => {
            setScreenState("doorsOpening");
        }, 1500);
        
        // Step 3: Complete (setelah animasi pintu selesai)
        setTimeout(() => {
            setScreenState("done");
            onStart();
        }, 3500);
    };
    
    // Don't render if not active or animation is complete
    if (!isActive || screenState === "done") {
        return null;
    }

    return (
        <AnimatePresence mode="wait">
            <m.div
                key="start-screen-container"
                className="fixed inset-0 z-[10000] bg-black overflow-hidden"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                    {/* === STAGE 1: Power Button === */}
                    {screenState === "idle" && (
                        <m.div
                            className="absolute inset-0 bg-black flex items-center justify-center cursor-pointer"
                            onClick={handleClick}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Power Button Container */}
                            <m.div
                                className="relative flex flex-col items-center gap-6"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Power Button Circle */}
                                <m.div
                                    className="relative w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center"
                                    whileHover={{ 
                                        borderColor: "rgba(255,255,255,0.8)",
                                        boxShadow: "0 0 30px rgba(255,255,255,0.2)"
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {/* Inner glow */}
                                    <m.div
                                        className="absolute inset-2 rounded-full bg-white/5"
                                        animate={{ 
                                            opacity: [0.3, 0.6, 0.3],
                                        }}
                                        transition={{ 
                                            duration: 2, 
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                    
                                    {/* Power Icon */}
                                    <svg 
                                        width="40" 
                                        height="40" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="1.5"
                                        className="text-white/80"
                                    >
                                        <path d="M12 2v4M12 12v-2M5.636 5.636a9 9 0 1 0 12.728 0" />
                                        <path d="M12 12a4 4 0 1 0 0-8" />
                                    </svg>
                                </m.div>

                                {/* Click hint */}
                                <m.p
                                    className="text-white/40 text-xs tracking-[0.3em] uppercase"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                >
                                    Click to Start
                                </m.p>
                            </m.div>
                        </m.div>
                    )}

                    {/* === STAGE 2: RamosOS Text === */}
                    {screenState === "showingText" && (
                        <m.div
                            className="absolute inset-0 bg-black flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <m.div className="flex items-center gap-1">
                                {"RamosOS".split("").map((char, i) => (
                                    <m.span
                                        key={i}
                                        className="text-white text-5xl md:text-7xl font-light tracking-tight"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ 
                                            opacity: 0, 
                                            y: -20,
                                            transition: { duration: 0.2 }
                                        }}
                                        transition={{ 
                                            delay: i * 0.08, 
                                            duration: 0.4,
                                            ease: [0.22, 1, 0.36, 1]
                                        }}
                                    >
                                        {char}
                                    </m.span>
                                ))}
                            </m.div>
                            {/* Removed: Subtle glow under text */}
                        </m.div>
                    )}

                    {/* === STAGE 3: Japanese Door Split === */}
                    {screenState === "doorsOpening" && (
                        <>
                            {/* Left Door - Slides to LEFT */}
                            <m.div
                                className="absolute inset-y-0 left-0 w-1/2 bg-black z-[10001]"
                                initial={{ x: 0 }}
                                animate={{ x: "-100%" }}
                                transition={{ 
                                    duration: 1.8, 
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: 0.2
                                }}
                            >
                                {/* Removed: Door edge highlight */}
                                
                                {/* Removed: Door texture/pattern */}
                            </m.div>

                            {/* Right Door - Slides to RIGHT */}
                            <m.div
                                className="absolute inset-y-0 right-0 w-1/2 bg-black z-[10001]"
                                initial={{ x: 0 }}
                                animate={{ x: "100%" }}
                                transition={{ 
                                    duration: 1.8, 
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: 0.2
                                }}
                            >
                                {/* Removed: Door edge highlight */}
                                
                                {/* Removed: Door texture/pattern */}
                            </m.div>

                            {/* Removed: Center line glow when doors separate */}

                            {/* Light burst from center - softer */}
                            <m.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 rounded-full bg-white/5"
                                initial={{ width: 0, height: 0, opacity: 1 }}
                                animate={{ width: 200, height: 200, opacity: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            />
                        </>
                    )}
                </m.div>
        </AnimatePresence>
    );
};

export default StartScreen;
