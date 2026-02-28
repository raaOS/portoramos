"use client";

import React, { useRef } from "react";
import { m, useMotionValue, useTransform, useSpring, MotionValue } from "framer-motion";
import { useSystemSound } from "@/hooks/useSystemSound";
import { DockPreferences } from "@/types/about";

interface DockItemProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    mouseX: MotionValue<number>;
    isOpen?: boolean;
    shouldBounceExternal?: boolean;
    isMobile?: boolean;
}

function DockItem({ id, icon, label, onClick, mouseX, isOpen = false, shouldBounceExternal = false, isMobile = false }: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { playPop } = useSystemSound();

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const baseWidth = isMobile ? 48 : 64;
    const hoverWidth = isMobile ? 48 : 128;

    const widthSync = useTransform(distance, [-150, 0, 150], [baseWidth, hoverWidth, baseWidth]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const [bounceKey, setBounceKey] = React.useState(0);
    const [isBouncing, setIsBouncing] = React.useState(false);

    const handleClick = () => {
        playPop();
        setIsBouncing(true);
        setBounceKey(prev => prev + 1);
        onClick();
    };

    React.useEffect(() => {
        if (!isBouncing) return;
        const timer = setTimeout(() => setIsBouncing(false), 1000);
        return () => clearTimeout(timer);
    }, [isBouncing]);

    const activeBounce = isBouncing || shouldBounceExternal;

    return (
        <m.div
            key={`${id}-${bounceKey}`}
            id={`dock-item-${id}`}
            ref={ref}
            // Optimization: If on mobile, bypass the heavy `useSpring` entirely and give it static sizing.
            style={isMobile ? { width: 48, height: 48 } : { width, height: width }}
            animate={activeBounce ? {
                y: isMobile ? [0, -12, 0, -4, 0] : [0, -24, 0, -8, 0],
                scaleX: [1, 0.9, 1.1, 1],
                scaleY: [1, 1.2, 0.9, 1]
            } : { y: 0, scaleX: 1, scaleY: 1 }}
            transition={activeBounce
                ? {
                    duration: 0.6,
                    times: [0, 0.2, 0.5, 0.8, 1],
                    ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
                    repeat: isBouncing ? 0 : (shouldBounceExternal ? Infinity : 0),
                    repeatDelay: 0.1,
                }
                : { type: "spring", mass: 0.1, stiffness: 250, damping: 18 }
            }
            onClick={handleClick}
            className="aspect-square rounded-[12px] flex items-center justify-center cursor-pointer relative group shrink-0"
            role="button"
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
                // Arrow key navigation between dock items
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const current = ref.current;
                    if (!current) return;
                    const parent = current.parentElement;
                    if (!parent) return;
                    const items = Array.from(parent.querySelectorAll('[role="button"]')) as HTMLElement[];
                    const idx = items.indexOf(current);
                    const next = e.key === 'ArrowRight' ? items[idx + 1] : items[idx - 1];
                    if (next) next.focus();
                }
            }}
        >
            {/* Tooltip - Disabled on Mobile */}
            {!isMobile && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/80 backdrop-blur-sm text-black text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-black/5 shadow-sm z-50">
                    {label}
                </div>
            )}
            <div className="flex items-center justify-center w-full h-full relative">
                {React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })}
            </div>
        </m.div>
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
        <m.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2 
            }}
        >
        <>
            {/* Invisible hit area that sits above ALL page content to capture mouse events.
                This transparent overlay covers just the dock area and forwards mouse position
                to the dock's mouseX MotionValue, ensuring magnification works regardless of
                CSS stacking context issues from page content (masonry grid etc.) */}
            {!isMobile && (
                <div
                    className="fixed bottom-0 left-0 right-0 h-28 z-[99999] cursor-default"
                    style={{ pointerEvents: 'auto', background: 'transparent' }}
                    onMouseMove={(e) => mouseX.set(e.clientX)}
                    onMouseLeave={() => mouseX.set(Infinity)}
                    aria-hidden="true"
                />
            )}
            <nav
                className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto ${isMobile ? 'max-w-[90vw]' : ''}`}
                role="toolbar"
                aria-label="Application dock"
                aria-orientation="horizontal"
                onMouseMove={(e) => !isMobile && mouseX.set(e.clientX)}
                onMouseLeave={() => !isMobile && mouseX.set(Infinity)}
            >
                <div
                    className={`flex items-end bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-2xl border border-white/40 rounded-[24px] shadow-lg shadow-black/10 ${isMobile
                        ? 'h-[72px] overflow-x-auto scrollbar-hide gap-5 px-5 py-3'
                        : 'h-[88px] gap-3 px-3 py-2.5'}`}
                    style={{
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)",
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
        </>
        </m.div>
    );
}
