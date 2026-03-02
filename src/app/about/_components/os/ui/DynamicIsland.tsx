import React, { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { ContactProfile } from "../data/mockChats";
import { getAvatarUrl } from "@/lib/avatar";

interface DynamicIslandProps {
    activeWindow: string | null;
    isBooting: boolean;
    onOpenChat?: (chatId?: string) => void;
    customNotifications?: ContactProfile[];
}

const DynamicIsland = ({ activeWindow, isBooting, onOpenChat, customNotifications }: DynamicIslandProps) => {
    const [notification, setNotification] = useState<{ id: string; name: string; message: string; avatar: string; initial: string } | null>(null);
    const [isGracePeriod, setIsGracePeriod] = useState(false);
    const [displayedMessage, setDisplayedMessage] = useState("");
    const [showVerified, setShowVerified] = useState(false);
    const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const textToggleRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(0);

    // Handle Active Window Grace Period
    useEffect(() => {
        if (activeWindow) {
            requestAnimationFrame(() => setIsGracePeriod(true));
            const timer = setTimeout(() => setIsGracePeriod(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [activeWindow]);

    // Typing effect for message - shorter max length
    const startTypingEffect = (message: any) => {
        // Safety: Ensure message is a string
        const safeMessage = typeof message === 'string' ? message : String(message || "");

        // Shorten message to max characters
        const shortMessage = safeMessage.length > 22 ? safeMessage.substring(0, 22) + "..." : safeMessage;
        setDisplayedMessage("");
        let index = 0;

        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

        typingIntervalRef.current = setInterval(() => {
            if (index < shortMessage.length) {
                const char = shortMessage[index];
                if (char !== undefined) {
                    setDisplayedMessage(prev => prev + char);
                }
                index++;
            } else {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            }
        }, 30);
    };

    // Toggle between name and verified text
    const startTextToggle = () => {
        if (textToggleRef.current) clearInterval(textToggleRef.current);

        setShowVerified(false);

        let toggleCount = 0;
        textToggleRef.current = setInterval(() => {
            toggleCount++;
            setShowVerified(prev => !prev);

            if (toggleCount >= 5) {
                if (textToggleRef.current) clearInterval(textToggleRef.current);
            }
        }, 2000);
    };

    const triggerNotification = React.useCallback(async (index?: number) => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        if (textToggleRef.current) clearInterval(textToggleRef.current);

        let randomTesti;

        if (customNotifications && customNotifications.length > 0) {
            const actualIndex = index !== undefined ? index : Math.floor(Math.random() * customNotifications.length);
            const randomContact = customNotifications[actualIndex];

            const isGenericStatus = !randomContact.status || ["Online", "Terakhir dilihat", "Akun Bisnis"].some(s => randomContact.status?.includes(s));

            const notificationMsg = (!isGenericStatus && randomContact.status)
                ? randomContact.status
                : (randomContact.conversation && randomContact.conversation.length > 0
                    ? randomContact.conversation[randomContact.conversation.length - 1].text
                    : "Mengirim pesan...");

            const initial = randomContact.name.charAt(0).toUpperCase();

            randomTesti = {
                id: `notif-${Date.now()}`,
                name: randomContact.name,
                message: notificationMsg,
                avatar: (randomContact.avatar && randomContact.avatar.startsWith('http'))
                    ? randomContact.avatar
                    : getAvatarUrl(randomContact.name),
                initial
            };
        }

        if (randomTesti) {
            setNotification(randomTesti);
            startTypingEffect(randomTesti.message);
            startTextToggle();

            notificationTimerRef.current = setTimeout(() => {
                setNotification(null);
                setDisplayedMessage("");
                setShowVerified(false);
                notificationTimerRef.current = null;
            }, 10000);
        }
    }, [customNotifications]);

    useEffect(() => {
        if (isBooting) return;
        if (!customNotifications || customNotifications.length === 0) return;

        let interval: NodeJS.Timeout | null = null;

        const initialDelay = setTimeout(() => {
            // Start with first testimonial
            triggerNotification(0);

            interval = setInterval(() => {
                // Cycle to next testimonial
                currentIndexRef.current = (currentIndexRef.current + 1) % customNotifications.length;
                triggerNotification(currentIndexRef.current);
            }, 15000);
        }, 2000);

        return () => {
            clearTimeout(initialDelay);
            if (interval) clearInterval(interval);
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            if (textToggleRef.current) clearInterval(textToggleRef.current);
        };
    }, [isBooting, customNotifications, triggerNotification]);

    const currentState = (notification && !isGracePeriod)
        ? "notification"
        : (activeWindow ? "active-window" : "idle");

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
            width: typeof window !== 'undefined' && window.innerWidth < 400 ? '92vw' : 240,
            height: 48,
            borderRadius: 24,
        },
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
                <div className="w-full h-full relative flex items-center text-white px-3">

                    {/* Idle State */}
                    {currentState === "idle" && null}

                    {/* Active Window State */}
                    {currentState === "active-window" && (
                        <m.div
                            className="flex items-center gap-3 w-full justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium truncate max-w-[140px]">
                                {activeWindow}
                            </span>
                        </m.div>
                    )}

                    {/* Notification State */}
                    {currentState === "notification" && notification && (
                        <m.div
                            className="flex items-center gap-3 w-full h-full cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                                if (textToggleRef.current) clearInterval(textToggleRef.current);
                                setNotification(null);
                                setDisplayedMessage("");
                                setShowVerified(false);
                                onOpenChat?.(notification.name);
                            }}
                        >
                            {/* Avatar with Elastic Bounce */}
                            <m.div
                                className="shrink-0 relative flex items-center justify-center w-7 h-7"
                                animate={{
                                    y: [0, -2, 0],
                                    scaleY: [1, 1.06, 0.97, 1],
                                    scaleX: [1, 0.97, 1.02, 1],
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    ease: [0.34, 1.56, 0.64, 1],
                                    times: [0, 0.4, 0.7, 1],
                                }}
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-white">
                                    {notification.initial}
                                </div>
                            </m.div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Name / Verified Row */}
                                <div className="flex items-center gap-1.5">
                                    <div className="relative h-4 overflow-hidden flex-1">
                                        {/* Name */}
                                        <m.span
                                            animate={{
                                                y: showVerified ? -16 : 0,
                                                opacity: showVerified ? 0 : 1,
                                            }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="absolute inset-0 font-semibold text-[12px] text-white truncate flex items-center leading-none"
                                        >
                                            {notification.name}
                                        </m.span>
                                        {/* Verified */}
                                        <m.span
                                            animate={{
                                                y: showVerified ? 0 : 16,
                                                opacity: showVerified ? 1 : 0,
                                            }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="absolute inset-0 inline-flex items-center gap-1 text-[10px] text-green-400 font-medium leading-none"
                                        >
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            Verified Testimonial
                                        </m.span>
                                    </div>
                                </div>

                                {/* Testimonial Quote */}
                                <p className="text-gray-400 text-[10px] truncate mt-0.5 leading-tight">
                                    &ldquo;{displayedMessage || ""}&rdquo;
                                </p>
                            </div>
                        </m.div>
                    )}
                </div>
            </m.div>
        </div>
    );
};

export default DynamicIsland;
