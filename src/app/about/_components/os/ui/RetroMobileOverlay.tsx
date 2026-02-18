"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import "./retro/retro-os.css";

// Sad Mac SVG - Pixelated Style
const SadMacIcon = () => (
    <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixelated">
        <rect width="40" height="40" fill="black" />
        <rect x="2" y="2" width="36" height="30" fill="white" />
        <rect x="2" y="34" width="36" height="4" fill="white" />
        {/* Screen Area */}
        <rect x="6" y="6" width="28" height="20" fill="white" stroke="black" strokeWidth="2" />
        {/* Sad Face */}
        <rect x="12" y="12" width="2" height="2" fill="black" />
        <rect x="26" y="12" width="2" height="2" fill="black" />
        <path d="M14 22C14 22 16 19 20 19C24 19 26 22 26 22" stroke="black" strokeWidth="2" />
        {/* Small details */}
        <rect x="32" y="35" width="2" height="2" fill="black" />
    </svg>
);

// Apple Logo - Classic Rainbow
const RainbowApple = () => (
    <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
        <path d="M323.5 10c-30.8 1.8-62.1 20.8-78.5 40.5-16.1 19.3-25.5 49-20.7 76.5 32.1 2.2 60.1-18.4 75.3-38.3 14.8-19.1 23.4-51.5 23.9-78.7z" fill="#5EBD3E" />
        <path d="M430.4 200.5c-44.5-2.7-72.2-26.7-72.2-26.7s-22.1 28.1-66.2 28.1c-40.4 0-66.1-26.6-66.1-26.6s-27.1 24-71.1 26.6c-48 2.8-85-28.1-105-64.8-10.4-19.1-34.6-96.1-34.6-135.2 0-36.2 13-63.4 34.6-81.9C15.3-102.7 44.9-122.9 83.9-122.9c37.4 0 63.8 24.1 63.8 24.1s27.2-24.1 77.2-24.1c48 0 77.2 26.2 77.2 26.2s34.8-26.2 81.3-26.2c40 0 71.9 22.1 91.8 54.7 10.4 17.5 15.6 39.5 15.6 63.2 0 46.8-19.4 135.2-19.4 135.2s-13.8 45.4-40.8 70.3z" fill="#F78200" transform="translate(0, 100)" />
        {/* We'll use a simplified version for better loading */}
    </svg>
);

export default function RetroMobileOverlay() {
    const [step, setStep] = useState<"boot" | "error" | "details">("boot");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === "boot") {
            const timer = setTimeout(() => setStep("error"), 2000);
            return () => clearTimeout(timer);
        }
        if (step === "details") {
            const interval = setInterval(() => {
                setProgress(p => (p < 100 ? p + 2 : p));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="fixed inset-0 z-[10000] bg-[#c0c0c0] flex items-center justify-center p-6 retro-os-container touch-none select-none overflow-hidden">
            <AnimatePresence mode="wait">
                {step === "boot" && (
                    <m.div
                        key="boot"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="w-20 h-24 bg-white/20 rounded animate-pulse flex items-center justify-center">
                            {/* Simplified Apple Retro Logo Placeholder */}
                            <div className="flex flex-col gap-1">
                                <div className="w-12 h-2 bg-[#5EBD3E]" />
                                <div className="w-12 h-2 bg-[#FFB900]" />
                                <div className="w-12 h-2 bg-[#F78200]" />
                                <div className="w-12 h-2 bg-[#E23838]" />
                                <div className="w-12 h-2 bg-[#973999]" />
                                <div className="w-12 h-2 bg-[#009CDF]" />
                            </div>
                        </div>
                        <p className="text-black font-bold tracking-widest text-sm uppercase">Loading Macintosh OS...</p>
                    </m.div>
                )}

                {(step === "error" || step === "details") && (
                    <m.div
                        key="error-box"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="retro-window w-full max-w-[340px] shadow-2xl"
                    >
                        <div className="retro-title-bar">
                            <span className="retro-title-text">System Error</span>
                        </div>
                        <div className="retro-content flex flex-col items-center gap-4 text-center">
                            <SadMacIcon />

                            <div className="space-y-3">
                                <p className="text-[14px] font-bold leading-tight">
                                    Sorry, a system error occurred.
                                </p>
                                <p className="text-[12px] leading-relaxed">
                                    This device lacks the necessary 'Creative RAM' to run Ramos's Desktop OS.
                                </p>
                                <p className="text-[11px] italic bg-black text-white p-1">
                                    Error Code: DEVICE_TOO_SMALL_V1994
                                </p>
                            </div>

                            {step === "error" ? (
                                <button
                                    onClick={() => setStep("details")}
                                    className="retro-button mt-2 font-bold"
                                >
                                    Restart in Desktop
                                </button>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className="retro-progress-container">
                                        <div className="retro-progress-bar" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px]">Attempting to transmit data to Macintosh...</p>

                                    {progress >= 100 && (
                                        <m.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-4 border border-black flex flex-col items-center gap-2"
                                        >
                                            {/* Placeholder for QR/Floppy disk UI */}
                                            <div className="w-24 h-24 bg-gray-200 border-2 border-black flex items-center justify-center relative">
                                                <div className="absolute top-0 right-0 w-4 h-4 bg-gray-300 border-l-2 border-b-2 border-black" />
                                                <span className="text-[8px] font-bold text-center">SCAN DISK<br />TO SYNC</span>
                                            </div>
                                            <p className="text-[10px] font-bold">Please switch to a Laptop or PC for the full experience.</p>
                                            <a href="/" className="text-[10px] underline">Back to Home</a>
                                        </m.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
