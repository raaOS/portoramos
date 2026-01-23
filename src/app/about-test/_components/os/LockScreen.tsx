"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";

interface LockScreenProps {
    onUnlock: () => void;
    isLocked: boolean;
}

export default function LockScreen({ onUnlock, isLocked }: LockScreenProps) {
    const [time, setTime] = useState(new Date());
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLocked && e.key === "Enter") {
                onUnlock();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLocked, onUnlock]);

    const handleLogin = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Simple dummy auth - accept anything
        if (password.length > 0) {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
        }
    };

    const formattedTime = time.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const formattedDate = time.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <AnimatePresence>
            {isLocked && (
                <motion.div
                    initial={{ y: 0 }}
                    exit={{ y: "-100%", transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }}
                    className="fixed inset-0 z-[10001] flex flex-col items-center justify-start pt-32 text-white bg-black/40 backdrop-blur-3xl"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop"
                            alt="Lock Screen Wallpaper"
                            className="w-full h-full object-cover scale-110 blur-xl opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Clock & Date */}
                    <div className="flex flex-col items-center mb-16 drop-shadow-lg">
                        <div className="text-xl font-medium tracking-wide mb-2 opacity-90">{formattedDate}</div>
                        <div className="text-8xl font-bold tracking-tighter">{formattedTime}</div>
                    </div>

                    {/* User Profile & Login */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-6"
                    >
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gray-200/20 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="text-4xl">👨‍💻</div>
                        </div>

                        {/* User Name */}
                        <div className="text-xl font-semibold tracking-wide">Ramos</div>

                        {/* Login Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onUnlock}
                            className="bg-white/20 backdrop-blur-md border border-white/30 px-8 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all shadow-lg flex items-center gap-2 group"
                        >
                            <span>Explore Workspace</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <div className="flex items-center gap-2 opacity-60 text-[10px] font-medium tracking-wide">
                            <Lock size={10} />
                            <span>Press Enter to Unlock</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
