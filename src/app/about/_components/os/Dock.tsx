"use client";

import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useSystemSound } from "@/hooks/useSystemSound";
import { DockPreferences } from "@/types/about";

interface DockItemProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    mouseX: any;
    isOpen?: boolean;
    shouldBounceExternal?: boolean;
    isMobile?: boolean; // Added prop
}

function DockItem({ id, icon, label, onClick, mouseX, isOpen = false, shouldBounceExternal = false, isMobile = false }: DockItemProps) {
    const ref = React.useRef<HTMLDivElement>(null);
    const { playPop } = useSystemSound();

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const baseWidth = isMobile ? 48 : 64; // Smaller base width on mobile
    const hoverWidth = isMobile ? 48 : 128; // No magnification on mobile

    const widthSync = useTransform(distance, [-150, 0, 150], [baseWidth, hoverWidth, baseWidth]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const [isBouncing, setIsBouncing] = React.useState(false);

    const handleClick = () => {
        playPop();
        setIsBouncing(true);
        onClick();
    };

    React.useEffect(() => {
        if (!isBouncing) return;
        const timer = setTimeout(() => setIsBouncing(false), 2000);
        return () => clearTimeout(timer);
    }, [isBouncing]);

    const shouldBounce = isOpen || isBouncing || shouldBounceExternal;

    return (
        <motion.div
            id={`dock-item-${id}`}
            ref={ref}
            style={{ width, height: width }}
            animate={shouldBounce ? { y: isMobile ? [0, -10, 0] : [0, -20, 0] } : { y: 0 }} // Smaller bounce on mobile
            transition={shouldBounce
                ? {
                    duration: isOpen ? 0.75 : 0.4,
                    repeat: isOpen ? Infinity : (shouldBounceExternal ? 2 : 0),
                    repeatDelay: isOpen ? 0.1 : 0.05,
                    ease: "easeInOut"
                }
                : { type: "spring", mass: 0.1, stiffness: 150, damping: 12 }
            }
            onClick={handleClick}
            className="aspect-square rounded-[12px] flex items-center justify-center cursor-pointer relative group shrink-0"
            role="button"
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
        >
            {/* Tooltip - Disabled on Mobile */}
            {!isMobile && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/80 backdrop-blur-sm text-black text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-black/5 shadow-sm z-50">
                    {label}
                </div>
            )}
            <div className="flex items-center justify-center w-full h-full">
                {React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })}
            </div>
        </motion.div>
    );
}

interface DockProps {
    items: { id: string; label: string; icon: React.ReactNode; onClick: () => void; isOpen?: boolean }[];
    bouncingId?: string | null;
    config?: DockPreferences;
    isMobile?: boolean;
}

export default function Dock({ items, bouncingId, config, isMobile = false }: DockProps) {
    const mouseX = useMotionValue(Infinity);

    const visibleItems = items.filter(item => {
        if (!config) return true;
        const itemConfig = config[item.id];
        return !itemConfig?.isHidden;
    }).map(item => {
        if (config && config[item.id]?.label) {
            return { ...item, label: config[item.id].label! };
        }
        return item;
    });

    return (
        <nav
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto ${isMobile ? 'max-w-[90vw]' : ''}`}
            role="navigation"
            aria-label="Application dock"
            onMouseMove={(e) => !isMobile && mouseX.set(e.pageX)}
            onMouseLeave={() => !isMobile && mouseX.set(Infinity)}
        >
            <div
                className={`flex items-end bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-2xl border border-white/40 rounded-[24px] shadow-2xl shadow-black/20 ${isMobile
                    ? 'h-[72px] overflow-x-auto scrollbar-hide gap-5 px-5 py-3'
                    : 'h-[88px] gap-3 px-3 py-2.5'}`}
                style={{
                    boxShadow: "0 20px 50px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
                    minWidth: isMobile ? 'auto' : visibleItems.length * 64 + (visibleItems.length - 1) * 12 + 24,
                    minHeight: isMobile ? 72 : 88,
                }}
            >
                {visibleItems.map((item) => (
                    <DockItem
                        key={item.id}
                        id={item.id}
                        icon={item.icon}
                        label={item.label}
                        onClick={item.onClick}
                        mouseX={mouseX}
                        isOpen={item.isOpen}
                        shouldBounceExternal={bouncingId === item.id}
                        isMobile={isMobile}
                    />
                ))}
            </div>
        </nav>
    );
}
