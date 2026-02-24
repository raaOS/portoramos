"use client";

import React from "react";
import { m } from "framer-motion";
import { Power } from "lucide-react";

interface StartScreenProps {
    onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
    return (
        <m.div
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
        >
            {/* Vintage Monitor Reflection Effect - Moved to cover whole screen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

            <m.div
                className="flex flex-col items-center gap-8 relative z-10"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
            >
                {/* Power Button */}
                <m.button
                    onClick={onStart}
                    className="relative group w-24 h-24 rounded-full bg-black border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-white/20 cursor-pointer overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Animated Pulsing Ring */}
                    <m.div
                        className="absolute inset-0 rounded-full border border-white/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <Power size={32} className="text-white/40 group-hover:text-white transition-colors duration-300" />
                </m.button>

                {/* Text Prompt */}
                <m.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <p className="text-white/40 font-mono text-[10px] tracking-[0.3em] uppercase">
                        System Ready
                    </p>
                    <p className="text-white/60 font-mono text-xs tracking-widest uppercase">
                        Push to Power On
                    </p>
                </m.div>
            </m.div>

            {/* CRT Scanline Effect (Optional/Subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </m.div>
    );
};

export default StartScreen;
