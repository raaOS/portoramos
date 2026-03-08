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

function DockItem({ id, icon, label, onClick, mouseX, shouldBounceExternal = false, isMobile = false }: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { playPop } = useSystemSound();

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    // OPTIMIZATION: Instead of animating DOM width/height (Layout Thrashing CPU bind),
    // we animate a uniform CSS scale transform while keeping the bounds fixed!
    const baseWidth = isMobile ? 48 : 64;
    const hoverScaleMultiplier = isMobile ? 1 : 1.6;

    // Magnification logic: distance-based scale factor
    const scaleSync = useTransform(distance, [-100, 0, 100], [1, hoverScaleMultiplier, 1]);

    // SMOOTHNESS: useSpring adds the buttery feel to the magnification
    const springScale = useSpring(scaleSync, { mass: 0.1, stiffness: 250, damping: 20 });

    // Map the spring scale to pixel dimensions
    const width = useTransform(springScale, (s) => s * baseWidth);
    const height = useTransform(springScale, (s) => s * baseWidth);

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
            // DYNAMIC layout (Affects siblings)
            style={isMobile
                ? { width: 48, height: 48 }
                : { width: width, height: height, transformOrigin: "center bottom" }
            }
            layout={true} // Re-enable layout to allow siblings to push each other
            animate={activeBounce ? {
                y: isMobile ? [0, -6, 0, -2, 0] : [0, -12, 0, -4, 0],
                // When bouncing, we add slight squash and stretch *on top* of the current scale.
                scaleX: isMobile ? [1, 0.9, 1.1, 1] : undefined, // Framer handles scale compositing poorly if mixed with style={scale}
                scaleY: isMobile ? [1, 1.2, 0.9, 1] : undefined
            } : { y: 0 }}
            transition={activeBounce
                ? {
                    duration: 0.6,
                    times: [0, 0.2, 0.5, 0.8, 1],
                    ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
                    repeat: isBouncing ? 0 : (shouldBounceExternal ? Infinity : 0),
                    repeatDelay: 0.1,
                }
                : { type: "spring", mass: 0.1, stiffness: 250, damping: 20 }
            }
            onClick={handleClick}
            className="aspect-square rounded-[12px] flex items-center justify-center cursor-pointer relative group shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none"
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
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/80 backdrop-blur-sm text-black text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-black/5 z-50">
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
                    <m.div
                        layout // Smoothly animate container size changes
                        className={`flex items-end bg-gradient-to-b from-white/25 to-white/10 backdrop-blur-2xl border border-white/40 rounded-[24px] ${isMobile
                            ? 'h-[72px] overflow-x-auto scrollbar-hide gap-5 px-5 py-3'
                            : 'h-[96px] gap-2 px-3 py-4'}`}
                        style={{
                            minWidth: isMobile ? 'auto' : visibleItems.length * 64 + (visibleItems.length - 1) * 8 + 24,
                            minHeight: isMobile ? 72 : 96,
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
                    </m.div>
                </nav>
            </>
        </m.div>
    );
}
