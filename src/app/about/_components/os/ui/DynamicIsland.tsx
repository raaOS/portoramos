import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Music, AppWindow } from "lucide-react";

interface DynamicIslandProps {
    activeWindow: string | null;
    isBooting: boolean;
    onOpenChat?: (chatId?: string) => void;
}

const testimonials = [
    { name: "Sari Rahmawati", message: "Mas, desain kemasannya udah dilihat tim. Suka!", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" },
    { name: "Dodi Kurniawan", message: "Wih, web lu sekarang keren amat bro.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop" },
    { name: "Pak Bambang", message: "Siang Mas, proposal penawaran sudah saya baca.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop" },
    { name: "Rini (HRD)", message: "Halo Mas, bisa diskusi soal project redesign web?", avatar: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=150&auto=format&fit=crop" },
    { name: "Andi Fotografer", message: "Mas, foto katalog kemarin udah saya edit ya.", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" },
];

const DynamicIsland = ({ activeWindow, isBooting, onOpenChat }: DynamicIslandProps) => {
    // Determine state based on props
    // "idle" | "active-window" | "booting" | "notification"
    const [isHovered, setIsHovered] = useState(false);
    const [notification, setNotification] = useState<typeof testimonials[0] | null>(null);
    const [isGracePeriod, setIsGracePeriod] = useState(false);
    const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Handle Active Window Grace Period
    useEffect(() => {
        if (activeWindow) {
            setIsGracePeriod(true);
            const timer = setTimeout(() => setIsGracePeriod(false), 1000); // 1s grace period
            return () => clearTimeout(timer);
        }
    }, [activeWindow]);

    // Notification Interval Logic
    useEffect(() => {
        if (isBooting) return;

        // Custom interval: Wait 2s initial, then show every 8s cycle (5s show + 3s gap)
        const initialDelay = setTimeout(() => {
            triggerNotification();

            const interval = setInterval(() => {
                triggerNotification();
            }, 8000);

            return () => {
                clearInterval(interval);
                if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            };
        }, 2000);

        return () => {
            clearTimeout(initialDelay);
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        };
    }, [isBooting]);

    const triggerNotification = () => {
        // Clear existing timer if any
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);

        const randomTesti = testimonials[Math.floor(Math.random() * testimonials.length)];
        setNotification(randomTesti);

        // Hide after 5 seconds
        notificationTimerRef.current = setTimeout(() => {
            setNotification(null);
            notificationTimerRef.current = null;
        }, 5000);
    };

    // Priority: Notification (highest) > Hover > Active Window > Idle
    const currentState = (notification && !isGracePeriod)
        ? "notification"
        : (isHovered ? "hovered" : (activeWindow ? "active-window" : "idle"));

    // Animation Variants
    const variants = {
        idle: {
            width: 90,
            height: 32,
            borderRadius: 20,
        },
        active: {
            width: 200,
            height: 48,
            borderRadius: 24,
        },
        notification: {
            width: typeof window !== 'undefined' && window.innerWidth < 400 ? '95vw' : 320,
            height: 64,
            borderRadius: 32,
        },
        hovered: {
            width: typeof window !== 'undefined' && window.innerWidth < 400 ? '95vw' : 320,
            height: 120,
            borderRadius: 24,
        }
    };

    if (isBooting) return null;

    return (
        <div className="fixed top-[42px] left-0 right-0 flex justify-center z-[9999] pointer-events-none">
            <motion.div
                className="bg-black shadow-2xl overflow-hidden pointer-events-auto cursor-default border border-white/10"
                initial="idle"
                animate={currentState === "active-window" ? "active" : currentState}
                variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="w-full h-full relative flex items-center justify-center text-white px-4">

                    {/* Idle State - Hidden */}
                    {currentState === "idle" && null}

                    {/* Active Window State (Compact) */}
                    {currentState === "active-window" && (
                        <motion.div
                            className="flex items-center gap-3 w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium truncate flex-1 text-center">
                                {activeWindow}
                            </span>
                            <AppWindow size={14} className="text-white/60" />
                        </motion.div>
                    )}

                    {/* Notification State */}
                    {currentState === "notification" && notification && (
                        <motion.div
                            className="flex items-center gap-3 w-full px-1 cursor-pointer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onClick={() => {
                                if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                                setNotification(null); // Dismiss notification immediately
                                onOpenChat?.(notification.name);
                            }}
                        >
                            {/* Avatar */}
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                                <img src={notification.avatar} alt={notification.name} className="object-cover w-full h-full" />
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                            </div>

                            {/* Text */}
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-xs font-bold text-white/90 flex justify-between items-center">
                                    {notification.name}
                                    <span className="text-[10px] text-white/40 font-normal">Now</span>
                                </span>
                                <span className="text-xs text-white/70 truncate">
                                    {notification.message}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Expanded State (Hovered) */}
                    <AnimatePresence>
                        {isHovered && currentState === "hovered" && (
                            <motion.div
                                className="absolute inset-0 p-4 flex flex-col justify-between"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* ... existing hover content but maybe adapted? actually let's keep it generic for now or show active app info if active, or notification info if notification was prior state? For simplicity, we keep the generic 'Active App' view or we can make it smart later. */}
                                {/* Reusing the Active App view for now as 'Control Center' */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <AppWindow size={20} className="text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-white/50 uppercase tracking-wider">Control Center</span>
                                            <span className="text-sm font-bold">{activeWindow || "System Ready"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-2">
                                    <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-white" />
                                    </div>
                                    <span className="text-[10px] font-mono opacity-50">RAMOS OS</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default DynamicIsland;
