"use client";

import React, { useRef, useEffect } from "react";
import { m, useDragControls, AnimatePresence } from "framer-motion";
import { X, Minus, Square, Pin, Lock } from "lucide-react";
import { soundManager } from "./utils/SoundManager";

interface WindowProps {
    id: string;
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onFocus?: () => void;
    zIndex?: number;
    initialPosition?: { x: number; y: number }; // Default position
    minimizeTarget?: { x: number; y: number }; // Target for minimize animation
    noPadding?: boolean;
    onUpdatePosition?: (x: number, y: number) => void;
    width?: number;
    height?: number;
    onResize?: (width: number, height: number) => void;
    onResizeEnd?: (width: number, height: number) => void;
    isPinned?: boolean;
    onTogglePin?: () => void;
    isAdmin?: boolean;
    animationVariant?: 'genie' | 'scale' | 'tv' | 'snap';
}

export default function OSWindow({
    id,
    title,
    children,
    isOpen,
    isMinimized = false,
    isMaximized = false,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    zIndex = 10,
    initialPosition = { x: 100, y: 100 },
    minimizeTarget,
    noPadding = false,
    onUpdatePosition,
    width,
    height,
    onResize,
    onResizeEnd,
    isPinned = false,
    onTogglePin,
    isAdmin = false,
    animationVariant = 'genie',
}: WindowProps) {
    const isMobileWindow = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTabletWindow = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const isSmallScreen = isMobileWindow || isTabletWindow;
    const winWidth = isMobileWindow ? window.innerWidth : isTabletWindow ? Math.min(window.innerWidth - 32, 700) : 600;
    const dragControls = useDragControls();

    // Internal state for resizing
    const [isResizing, setIsResizing] = React.useState(false);
    const [dynamicSize, setDynamicSize] = React.useState({ width, height });

    // Sync props to state (when not resizing)
    useEffect(() => {
        if (!isResizing) {
            setDynamicSize({ width, height });
        }
    }, [width, height, isResizing]);

    // Sound effect on open - delay until user interaction
    useEffect(() => {
        if (isOpen) {
            // Use setTimeout to ensure user interaction is detected first
            const timer = setTimeout(() => {
                soundManager.play('window-open', 0.4);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // "Premium Solid" Mode (Snappy, No Bounce, Direct)
    const getMinimizeState = () => {
        return {
            scale: 0.9,
            opacity: 0,
            x: initialPosition.x, // Force snap to origin X
            y: initialPosition.y, // Force snap to origin Y
            transition: { duration: 0.15, ease: "easeIn" } // Fast exit
        };
    };

    // Resize Handlers
    const resizeStartRef = useRef<{ x: number, y: number, w: number, h: number, dir: 'e' | 's' | 'se' } | null>(null);

    // Refs for callbacks to avoid stale closures
    const onResizeRef = useRef(onResize);
    const onResizeEndRef = useRef(onResizeEnd);
    useEffect(() => { onResizeRef.current = onResize; }, [onResize]);
    useEffect(() => { onResizeEndRef.current = onResizeEnd; }, [onResizeEnd]);

    // Separate ref for final size (to avoid mutating start values)
    const finalSizeRef = useRef({ w: 0, h: 0 });

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 's' | 'se') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        resizeStartRef.current = {
            x: clientX,
            y: clientY,
            w: dynamicSize.width || 0,
            h: dynamicSize.height || 0,
            dir: direction
        };
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
            if (!resizeStartRef.current) return;

            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const { x: startX, y: startY, w: startWidth, h: startHeight, dir: direction } = resizeStartRef.current;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction === 'e' || direction === 'se') {
                newWidth = Math.max(300, startWidth + deltaX);
            }
            if (direction === 's' || direction === 'se') {
                newHeight = Math.max(200, startHeight + deltaY);
            }

            // Update LOCAL state only (super fast, no parent re-render)
            setDynamicSize({ width: newWidth, height: newHeight });

            // Store final size in separate ref (DO NOT mutate resizeStartRef.w/.h!)
            finalSizeRef.current = { w: newWidth, h: newHeight };
        };

        const handleMouseUp = () => {
            if (isResizing) {
                const finalW = finalSizeRef.current.w;
                const finalH = finalSizeRef.current.h;

                // Sync to parent ONCE at the end via refs
                if (onResizeRef.current) onResizeRef.current(finalW, finalH);
                if (onResizeEndRef.current) onResizeEndRef.current(finalW, finalH);
            }
            setIsResizing(false);
            resizeStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isResizing]); // ONLY depend on isResizing, NOT dynamicSize


    return (
        <>
            {isOpen && (
                <m.div
                    drag={!isMaximized && !isResizing && !isPinned && !isSmallScreen}
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(e, info) => {
                        // We only want to update position if NOT maximizing/minimizing and NOT pinned
                        if (!isMaximized && !isMinimized && !isPinned && onUpdatePosition) {
                            // The final position is current (initial) + delta
                            // OR we can trust the visual position if we tracked it?
                            // Framer motion 'drag' modifies the transform, not the layout.
                            // To persist, we should add delta to initial.
                            const newX = initialPosition.x + info.offset.x;
                            const newY = initialPosition.y + info.offset.y;
                            onUpdatePosition(newX, newY);
                        }
                    }}
                    initial={{
                        scale: 0.95,
                        opacity: 0,
                        x: initialPosition.x,
                        y: initialPosition.y,
                    }}
                    animate={
                        isMinimized
                            ? getMinimizeState()
                            : isMaximized
                                ? {
                                    scale: 1,
                                    opacity: 1,
                                    x: 0,
                                    y: 0,
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 0,
                                    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }
                                }
                                : {
                                    scale: 1,
                                    opacity: 1,
                                    x: initialPosition.x,
                                    y: initialPosition.y,
                                    width: dynamicSize.width || width || winWidth, // USE DYNAMIC SIZE
                                    height: dynamicSize.height || height || "auto", // USE DYNAMIC SIZE
                                    borderRadius: 10,
                                    // Solid, Premium Spring (No wobble)
                                    transition: isResizing ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 25 }
                                }
                    }
                    exit={{
                        scale: 0.95,
                        opacity: 0,
                        transition: { duration: 0.15 }
                    }}
                    onPointerDown={onFocus}
                    style={{
                        position: "absolute",
                        zIndex: zIndex,
                        top: 0,
                        left: 0,
                    }}
                    data-lenis-prevent
                    className={`flex flex-col shadow-lg overflow-hidden border border-white/40 will-change-transform pointer-events-auto ${isSmallScreen
                        ? 'bg-white/95'
                        : 'bg-white/80 backdrop-blur-xl'
                        }`}
                >
                    {/* Title Bar */}
                    <div
                        onPointerDown={(e) => {
                            if (!isMaximized && !isPinned) dragControls.start(e);
                        }}
                        onDoubleClick={onMaximize}
                        className="h-8 sm:h-7 bg-[#EFEFEF] border-b border-[#D1D1D1] flex items-center justify-between px-3 shrink-0 cursor-default select-none relative z-50"
                    >
                        {/* Traffic Lights */}
                        <div className="flex gap-[8px] mr-3 items-center group">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    soundManager.play('window-close', 0.4);
                                    onClose();
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center group-hover:brightness-90 active:brightness-75 transition-all"
                                aria-label="Close window"
                            >
                                <span className="w-[12px] h-[12px] rounded-full bg-[#FF5F57] border-[0.5px] border-[#D6443F] shadow-sm flex items-center justify-center">
                                    <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
                                </span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMinimize && onMinimize(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center group-hover:brightness-90 active:brightness-75 transition-all"
                                aria-label="Minimize window"
                            >
                                <span className="w-[12px] h-[12px] rounded-full bg-[#FEBC2E] border-[0.5px] border-[#DDA335] shadow-sm flex items-center justify-center">
                                    <Minus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
                                </span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center group-hover:brightness-90 active:brightness-75 transition-all"
                                aria-label="Maximize window"
                            >
                                <span className="w-[12px] h-[12px] rounded-full bg-[#28C840] border-[0.5px] border-[#22AA32] shadow-sm flex items-center justify-center">
                                    {/* Outline Square for Expand */}
                                    <span className="w-[6px] h-[6px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rotate-45 transform scale-[0.8] block" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                                </span>
                            </button>
                        </div>

                        {/* Title Indicator */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 opacity-80 pointer-events-none w-[60%]">
                            <span className="text-xs font-semibold text-gray-700 tracking-wide drop-shadow-sm truncate block text-center w-full">{title}</span>
                        </div>

                        {/* Top Right Pin/Lock Button - Admin Only */}
                        {isAdmin && onTogglePin && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={`p-1 rounded transition-colors ${isPinned ? 'text-orange-600' : 'text-gray-400'}`}
                                    title={isPinned ? "Unlock Position" : "Pin/Lock Position"}
                                >
                                    {isPinned ? <Lock size={12} /> : <Pin size={12} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Window Content */}
                    <div
                        data-lenis-prevent
                        style={{ touchAction: "auto" }}
                        className={`relative flex-1 bg-white/50 w-full overflow-hidden ${noPadding ? '' : 'p-4'}`}
                    >
                        {children}

                        {/* Safe Zone for Resize Overlays (Only if not maximized and resizable) */}
                        {!isMaximized && !isSmallScreen && onResize && (
                            <>
                                {/* Right Handle */}
                                <div
                                    className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-[60] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                                    onTouchStart={(e) => handleResizeStart(e, 'e')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                                {/* Bottom Handle */}
                                <div
                                    className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-[60] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, 's')}
                                    onTouchStart={(e) => handleResizeStart(e, 's')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                                {/* Corner Handle */}
                                <div
                                    className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-[70] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors rounded-tl"
                                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                                    onTouchStart={(e) => handleResizeStart(e, 'se')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                />
                            </>
                        )}
                    </div>
                </m.div>
            )}
        </>
    );
}
