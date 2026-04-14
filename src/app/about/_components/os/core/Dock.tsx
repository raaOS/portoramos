"use client";

import React, { useRef, useEffect, useState } from "react";
import { m, useMotionValue, useTransform, useSpring, MotionValue, AnimatePresence, useScroll, useVelocity } from "framer-motion";
import { useSystemSound } from "@/hooks/useSystemSound";
import { DockPreferences } from "@/types/about";
import LiquidFilter from "@/components/shared/LiquidFilter";

interface DockItemProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    mouseX: MotionValue<number>;
    isOpen?: boolean;
    shouldBounceExternal?: boolean;
    isMobile?: boolean;
    popoverContent?: React.ReactNode;
    onPopoverToggle?: (isOpen: boolean) => void;
    anyPopoverOpen?: boolean;
}

function DockItem({ 
    id, 
    icon, 
    label, 
    onClick, 
    mouseX, 
    shouldBounceExternal = false, 
    isMobile = false,
    popoverContent,
    onPopoverToggle,
    anyPopoverOpen = false
}: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { playPop } = useSystemSound();

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const baseWidth = isMobile ? 48 : 64;
    const hoverScaleMultiplier = isMobile ? 1 : 1.6;

    const scaleSync = useTransform(distance, [-100, 0, 100], [1, hoverScaleMultiplier, 1]);
    const springScale = useSpring(scaleSync, { mass: 0.1, stiffness: 250, damping: 20 });

    const width = useTransform(springScale, (s) => anyPopoverOpen ? baseWidth : s * baseWidth);
    const height = useTransform(springScale, (s) => anyPopoverOpen ? baseWidth : s * baseWidth);

    const [bounceKey, setBounceKey] = React.useState(0);
    const [isBouncing, setIsBouncing] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const triggerAction = () => {
        playPop();
        setIsBouncing(true);
        setBounceKey(prev => prev + 1);
        onClick();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (popoverContent) {
            e.stopPropagation();
            const nextState = !isPopoverOpen;
            setIsPopoverOpen(nextState);
            onPopoverToggle?.(nextState);
            return;
        }
        triggerAction();
    };

    React.useEffect(() => {
        if (!isBouncing) return;
        const timer = setTimeout(() => setIsBouncing(false), 1000);
        return () => clearTimeout(timer);
    }, [isBouncing]);

    // Close popover when clicking outside
    React.useEffect(() => {
        if (!isPopoverOpen) return;
        const handleClickOutside = () => {
            setIsPopoverOpen(false);
            onPopoverToggle?.(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isPopoverOpen, onPopoverToggle]);

    const activeBounce = isBouncing || shouldBounceExternal;

    return (
        <m.div
            key={`${id}-${bounceKey}`}
            id={`dock-item-${id}`}
            ref={ref}
            style={isMobile
                ? { width: 48, height: 48 }
                : { width: width, height: height, transformOrigin: "center bottom" }
            }
            layout={true}
            animate={activeBounce ? {
                y: isMobile ? [0, -6, 0, -2, 0] : [0, -12, 0, -4, 0],
                scaleX: isMobile ? [1, 0.9, 1.1, 1] : undefined,
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
                if (e.key === 'Enter' || e.key === ' ') { 
                    e.preventDefault(); 
                    if (popoverContent) {
                        setIsPopoverOpen(!isPopoverOpen);
                    } else {
                        triggerAction();
                    }
                }
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
            {!isMobile && !isPopoverOpen && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-black text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-black/5 z-50">
                    {label}
                </div>
            )}

            <AnimatePresence>
                {isPopoverOpen && popoverContent && (
                    <m.div
                        initial={{ opacity: 0, y: 10, scale: 0.8, x: "-50%" }}
                        animate={{ opacity: 1, y: -20, scale: 1, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, scale: 0.8, x: "-50%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-full left-1/2 mb-4 bg-zinc-100 border border-white/40 rounded-2xl z-[100000] ring-1 ring-black/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {React.cloneElement(popoverContent as React.ReactElement, { 
                            onSelect: () => setIsPopoverOpen(false) 
                        })}
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-100 border-r border-b border-white/40 rotate-45" />
                    </m.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-center w-full h-full relative z-10 rounded-[12px] overflow-hidden">
                {React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })}
            </div>

        </m.div>
    );
}

interface DockItemData {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isOpen?: boolean;
    popoverContent?: React.ReactNode;
}

interface DockProps {
    items: DockItemData[];
    bouncingId?: string | null;
    config?: DockPreferences;
    isMobile?: boolean;
}

export default function Dock({ items, bouncingId, config, isMobile = false }: DockProps) {
    const mouseX = useMotionValue(Infinity);
    const [isMounted, setIsMounted] = useState(false);
    const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

    const handlePopoverToggle = useCallback((id: string, isOpen: boolean) => {
        if (isOpen) {
            setActivePopoverId(id);
            mouseX.set(Infinity); // Reset magnification when opening
        } else if (activePopoverId === id) {
            setActivePopoverId(null);
        }
    }, [activePopoverId, mouseX]);

    const anyPopoverOpen = activePopoverId !== null;

    // Scroll Awareness for Reactive Shimmer
    const { scrollY } = useScroll();
    const scrollVelocityRaw = useVelocity(scrollY);
    const scrollVelocity = useSpring(scrollVelocityRaw, { 
        stiffness: 100, 
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

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

    const dockBaseWidth = visibleItems.length > 0
        ? visibleItems.length * 64 + (visibleItems.length - 1) * 8 + 24
        : 0;
    const hoverCaptureWidth = dockBaseWidth + 160;

    return (
        <div className="print:hidden">
            {/* Render static placeholder during SSR to prevent hydration mismatch.
                Framer Motion's initial animation state differs between server and client. */}
            {!isMounted ? (
                <div style={{ opacity: 0 }} />
            ) : (
                <m.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.2
                    }}
                >
                    {/* Invisible hit area that sits above ALL page content to capture mouse events.
                    This transparent overlay covers just the dock area and forwards mouse position
                    to the dock's mouseX MotionValue, ensuring magnification works regardless of
                    CSS stacking context issues from page content (masonry grid etc.) */}
                    {!isMobile && (
                        <div
                            className="fixed bottom-0 left-1/2 h-28 z-[99999] -translate-x-1/2 cursor-default"
                            style={{ width: hoverCaptureWidth, pointerEvents: anyPopoverOpen ? 'none' : 'auto', background: 'transparent' }}
                            onMouseMove={(e) => !anyPopoverOpen && mouseX.set(e.clientX)}
                            onMouseLeave={() => mouseX.set(Infinity)}
                            aria-hidden="true"
                        />
                    )}
                    <nav
                        className={`relative z-[99999] pointer-events-auto ${isMobile ? 'max-w-[90vw]' : ''}`}
                        role="toolbar"
                        aria-label="Application dock"
                        aria-orientation="horizontal"
                        onMouseMove={(e) => !isMobile && !anyPopoverOpen && mouseX.set(e.clientX)}
                        onMouseLeave={() => !isMobile && mouseX.set(Infinity)}
                        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
                    >
                        {/* Liquid Glass Background Structure */}
                        <m.div 
                            layout
                            className={`absolute inset-0 rounded-[24px] pointer-events-none overflow-hidden shadow-[0_6px_6px_rgba(0,0,0,0.2),0_0_20px_rgba(0,0,0,0.1)] transition-all duration-400 ${isMobile
                                ? 'h-[72px]'
                                : 'h-[96px]'}`}
                        >
                            {/* 1. Effect Layer: Distortion + Blur */}
                            <div 
                                className="absolute inset-0 z-0 backdrop-blur-[3px]"
                                style={{ filter: 'url(#liquid-glass)' }}
                            />
                            
                            {/* 2. Tint Layer: Semi-transparent white */}
                            <div className="absolute inset-0 z-[1] bg-white/50" />
                            
                            {/* 3. Shine Layer: Inner shadows for glass rim lighting */}
                            <div 
                                className="absolute inset-0 z-[2] rounded-[24px]" 
                                style={{ 
                                    boxShadow: 'inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)'
                                }}
                            />
                        </m.div>

                        {/* Icon Layer (Clean and Sharp) */}
                        <m.div
                            layout
                            className={`flex items-end relative z-10 ${isMobile
                                ? 'h-[72px] overflow-x-auto scrollbar-hide gap-5 px-5 py-3'
                                : 'h-[96px] gap-2 px-3 py-4'}`}
                            style={{
                                minWidth: isMobile ? 'auto' : visibleItems.length * 64 + (visibleItems.length - 1) * 8 + 24,
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
                                    popoverContent={item.popoverContent}
                                    onPopoverToggle={(isOpen) => handlePopoverToggle(item.id, isOpen)}
                                    anyPopoverOpen={anyPopoverOpen}
                                    shouldBounceExternal={bouncingId === item.id}
                                    isMobile={isMobile}
                                />
                            ))}
                        </m.div>

                        <LiquidFilter id="liquid-glass" mouseX={mouseX} scrollVelocity={scrollVelocity} />
                    </nav>
                </m.div>
            )}
        </div>
    );
}
