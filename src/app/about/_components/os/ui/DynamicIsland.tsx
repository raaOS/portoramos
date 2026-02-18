import React, { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Music, AppWindow } from "lucide-react";

import { ContactProfile } from "../data/mockChats";
import { getAvatarUrl } from "@/lib/avatar";

interface DynamicIslandProps {
    activeWindow: string | null;
    isBooting: boolean;
    onOpenChat?: (chatId?: string) => void;
    customNotifications?: ContactProfile[];
    // TODO: New tasks for AI Helper and UI overhaul
    // - [x] Transition to Letter-based Avatars (Clean & Consistent) <!-- id: 6 -->
    // - [/] AI-Powered Testimonial Generator <!-- id: 7 -->
    //     - [/] Create `/api/ai/generate-testimonial` endpoint
    //     - [ ] Design new "WA Preview" component for Admin Panel
    //     - [ ] Rework `AdminTestimonialClient.tsx` UI (Split View + AI Magic Tool)
    //     - [ ] Implement AI prompt logic (Friendly, Polite, Professional tone)
    //     - [ ] Add "Number of Messages" selector for AI generation
    //     - [ ] Verify AI-generated content follows the "No Gue/Lu" rule
}

// WhatsApp Notif system now uses CRUD data from the Admin panel
// Legacy hardcoded list removed as it is now in testimonial.json

const DynamicIsland = ({ activeWindow, isBooting, onOpenChat, customNotifications }: DynamicIslandProps) => {
    // Determine state based on props
    // "idle" | "active-window" | "booting" | "notification"
    const [isHovered, setIsHovered] = useState(false);
    const [notification, setNotification] = useState<{ name: string; message: string; avatar: string } | null>(null);
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
    const lastIndexRef = useRef(0);

    useEffect(() => {
        if (isBooting) return;
        if (!customNotifications || customNotifications.length === 0) return;

        let interval: NodeJS.Timeout | null = null;

        // Custom interval: Wait 3s initial, then show every 12s cycle (5s show + 7s gap)
        // A longer gap feels more organic and less "spammy" than 8s
        const initialDelay = setTimeout(() => {
            triggerNotification(lastIndexRef.current % customNotifications.length);
            lastIndexRef.current++;

            interval = setInterval(() => {
                triggerNotification(lastIndexRef.current % customNotifications.length);
                lastIndexRef.current++;
            }, 7000); // 2s show + 5s hide = 7s cycle
        }, 1000);

        return () => {
            clearTimeout(initialDelay);
            if (interval) clearInterval(interval);
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        };
    }, [isBooting, customNotifications]); // Re-run if customNotifications changes

    const triggerNotification = (index?: number) => {
        // Clear existing timer if any
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);

        let randomTesti;

        if (customNotifications && customNotifications.length > 0) {
            // Use sequential index if provided, otherwise random fallback
            const actualIndex = index !== undefined ? index : Math.floor(Math.random() * customNotifications.length);
            const randomContact = customNotifications[actualIndex];

            // Prioritize the 'status' field (which now carries our 'notificationText')
            // but fallback to the last message if status is a generic WhatsApp status
            const isGenericStatus = !randomContact.status || ["Online", "Terakhir dilihat", "Akun Bisnis"].some(s => randomContact.status.includes(s));

            const notificationMsg = (!isGenericStatus && randomContact.status)
                ? randomContact.status
                : (randomContact.conversation && randomContact.conversation.length > 0
                    ? randomContact.conversation[randomContact.conversation.length - 1].text
                    : "Mengirim pesan...");

            randomTesti = {
                name: randomContact.name,
                message: notificationMsg,
                // Ensure there's always an avatar, and fallback if it's not a valid external URL
                avatar: (randomContact.avatar && randomContact.avatar.startsWith('http'))
                    ? randomContact.avatar
                    : getAvatarUrl(randomContact.name)
            };
        }

        if (randomTesti) {
            setNotification(randomTesti);

            // Hide after 2 seconds (As requested: "muncul 2 detik")
            notificationTimerRef.current = setTimeout(() => {
                setNotification(null);
                notificationTimerRef.current = null;
            }, 2000);
        }
    };

    // Priority: Notification (highest) > Active Window > Idle
    const currentState = (notification && !isGracePeriod)
        ? "notification"
        : (activeWindow ? "active-window" : "idle");

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
            <m.div
                className="bg-black shadow-2xl overflow-hidden pointer-events-auto cursor-default border border-white/10"
                initial="idle"
                animate={currentState === "active-window" ? "active" : currentState}
                variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <div className="w-full h-full relative flex items-center justify-center text-white px-4">

                    {/* Idle State - Hidden */}
                    {currentState === "idle" && null}

                    {/* Active Window State (Compact) */}
                    {currentState === "active-window" && (
                        <m.div
                            className="flex items-center gap-3 w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium truncate flex-1 text-center">
                                {activeWindow}
                            </span>
                            <AppWindow size={14} className="text-white/60" />
                        </m.div>
                    )}

                    {/* Notification State */}
                    {currentState === "notification" && notification && (
                        <m.div
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
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                                    <img src={notification.avatar} alt={notification.name} className="object-cover w-full h-full" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full z-20 shadow-lg scale-110"></div>
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
                        </m.div>
                    )}
                </div>
            </m.div>
        </div>
    );
};

export default DynamicIsland;
