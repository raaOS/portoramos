"use client";

import React, { useRef, useEffect } from "react";
import { m, useDragControls, AnimatePresence } from "framer-motion";
import { X, Minus, Pin, Lock, Maximize2 } from "lucide-react";
import { soundManager } from "../utils/SoundManager";

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
    isFocused?: boolean;
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
    // minimizeTarget is reserved for future use
    noPadding = false,
    onUpdatePosition,
    width,
    height,
    onResize,
    onResizeEnd,
    isPinned = false,
    onTogglePin,
    isAdmin = false,
    isFocused = false,
    // animationVariant is reserved for future use (default: 'genie')
}: WindowProps) {
    const windowRef = useRef<HTMLDivElement>(null);
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
            requestAnimationFrame(() => setDynamicSize({ width, height }));
        }
    }, [width, height, isResizing]);

    // Sound effect on open - delay until user interaction
    useEffect(() => {
        if (isOpen) {
            // Use setTimeout to ensure user interaction is detected first
            const timer = setTimeout(() => {
                soundManager.play('window-open');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle auto-focus when window becomes active
    useEffect(() => {
        if (isFocused && windowRef.current) {
            windowRef.current.focus();
        }
    }, [isFocused]);

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

        // PERFORMANCE FIX: Use requestAnimationFrame for throttled updates
        let rafId: number | null = null;
        let pendingSize = { width: 0, height: 0 };

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

            // Store final size in ref for mouseUp handler
            finalSizeRef.current = { w: newWidth, h: newHeight };

            // PERFORMANCE FIX: Throttle setState with requestAnimationFrame
            pendingSize = { width: newWidth, height: newHeight };
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    setDynamicSize(pendingSize);
                    rafId = null;
                });
            }
        };

        const handleMouseUp = () => {
            // Cancel any pending animation frame
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (isResizing) {
                const finalW = finalSizeRef.current.w;
                const finalH = finalSizeRef.current.h;

                // Ensure final size is applied
                setDynamicSize({ width: finalW, height: finalH });

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
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isResizing]); // ONLY depend on isResizing, NOT dynamicSize


    return (
        <AnimatePresence>
            {isOpen && (
                <m.div
                    ref={windowRef}
                    drag={!isMaximized && !isResizing && (!isPinned || isAdmin) && !isSmallScreen}
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(e, info) => {
                        // We only want to update position if NOT maximizing/minimizing 
                        // and either NOT pinned or is Admin
                        if (!isMaximized && !isMinimized && (!isPinned || isAdmin) && onUpdatePosition) {
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
                        scale: 0.4, // Start smaller for jelly pop
                        opacity: 0,
                        x: initialPosition.x,
                        y: initialPosition.y,
                    }}
                    animate={
                        isMinimized
                            ? {
                                ...getMinimizeState(),
                                transition: { type: "spring", stiffness: 300, damping: 25 }
                            }
                            : isMaximized
                                ? {
                                    // Jelly effect for maximize
                                    scale: [0.95, 1.03, 0.98, 1.01, 1],
                                    opacity: 1,
                                    x: 10,
                                    y: 36,
                                    width: "calc(100% - 20px)",
                                    height: "calc(100% - 46px)",
                                    borderRadius: 12,
                                }
                                : {
                                    // Jelly/Playful entry keyframes (squash & stretch)
                                    scale: [0.4, 1.2, 0.9, 1.05, 1], // Pop -> Overshoot -> Bounce back -> Settle
                                    opacity: 1,
                                    x: initialPosition.x,
                                    y: initialPosition.y,
                                    width: dynamicSize.width || width || winWidth,
                                    height: dynamicSize.height || height || "auto",
                                    borderRadius: 10,
                                }
                    }
                    transition={
                        isMinimized
                            ? { type: "spring", stiffness: 300, damping: 25 }
                            : isMaximized
                                ? {
                                    // Jelly transition for maximize
                                    scale: {
                                        type: "keyframes",
                                        times: [0, 0.25, 0.4, 0.6, 1],
                                        duration: 0.4,
                                        ease: "easeOut"
                                    },
                                    opacity: { duration: 0.2 },
                                    x: { duration: 0.3, ease: "easeOut" },
                                    y: { duration: 0.3, ease: "easeOut" },
                                    width: { duration: 0.3, ease: "easeOut" },
                                    height: { duration: 0.3, ease: "easeOut" },
                                    layout: { duration: 0 }
                                }
                                : isResizing 
                                    ? { duration: 0 }
                                    : {
                                        // Jelly transition config
                                        scale: {
                                            type: "keyframes",
                                            times: [0, 0.25, 0.4, 0.6, 1],
                                            duration: 0.5,
                                            ease: "easeOut"
                                        },
                                        opacity: { duration: 0.2 },
                                        x: { type: "spring", stiffness: 200, damping: 20 },
                                        y: { type: "spring", stiffness: 200, damping: 20 },
                                        width: { duration: 0 },
                                        height: { duration: 0 },
                                        layout: { duration: 0 }
                                    }
                    }
                    exit={{
                        scale: [1, 1.1, 0.5, 0], // Stretch then collapse
                        opacity: [1, 1, 0, 0],
                        transition: { 
                            duration: 0.35,
                            ease: "easeInOut"
                        }
                    }}
                    // Layout synchronization disabled to prevent cross-window glitching
                    layout={false} 

                    onPointerDown={onFocus}
                    onKeyDown={(e) => {
                        // Keyboard Shortcuts
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            soundManager.play('window-close');
                            onClose();
                        }
                        if (e.ctrlKey && e.key === 'm') {
                            e.preventDefault();
                            if (onMinimize) onMinimize();
                        }
                        if (e.ctrlKey && e.key === 'Enter') {
                            e.preventDefault();
                            if (onMaximize) onMaximize();
                        }

                        // Simple Focus Trap: Tab handling
                        if (e.key === 'Tab') {
                            const focusableElements = e.currentTarget.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );
                            if (focusableElements.length > 0) {
                                const firstElement = focusableElements[0] as HTMLElement;
                                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                                if (e.shiftKey) { // Shift + Tab
                                    if (document.activeElement === firstElement) {
                                        e.preventDefault();
                                        lastElement.focus();
                                    }
                                } else { // Tab
                                    if (document.activeElement === lastElement) {
                                        e.preventDefault();
                                        firstElement.focus();
                                    }
                                }
                            }
                        }
                    }}
                    tabIndex={0}
                    aria-modal="true"
                    role="dialog"
                    aria-label={title}
                    style={{
                        position: "absolute",
                        zIndex: zIndex,
                        top: 0,
                        left: 0,
                        transformOrigin: "center center",
                    }}
                    data-lenis-prevent
                    className={`flex flex-col overflow-hidden border border-white/40 will-change-transform pointer-events-auto rounded-lg outline-none ${isSmallScreen
                        ? 'bg-white'
                        : 'bg-white'
                        }`}
                >
                    {/* Title Bar */}
                    <div
                        onPointerDown={(e) => {
                            if (!isMaximized && (!isPinned || isAdmin)) dragControls.start(e);
                        }}
                        onDoubleClick={onMaximize}
                        className="h-8 sm:h-7 bg-[#EFEFEF] border-b border-[#D1D1D1] flex items-center justify-between px-3 shrink-0 cursor-default select-none relative z-50"
                    >
                        {/* Traffic Lights */}
                        <div className="flex gap-[8px] mr-3 items-center group">
                            {/* Close Button (Red) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    soundManager.play('window-close');
                                    onClose();
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                                aria-label="Close window"
                            >
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                                    <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                                </div>
                            </button>

                            {/* Minimize Button (Yellow) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onMinimize) onMinimize(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                                aria-label="Minimize window"
                            >
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DDA335] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                                    <Minus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                                </div>
                            </button>

                            {/* Maximize Button (Green) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onMaximize) onMaximize(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                                aria-label="Maximize window"
                            >
                                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#22AA32] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                                    <span className="w-[6px] h-[6px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rotate-45 transform scale-[0.8] block" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                                </div>
                            </button>
                        </div>


                        {/* Title Indicator */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 opacity-80 pointer-events-none w-[60%]">
                            <span className="text-xs font-semibold text-gray-700 tracking-wide truncate block text-center w-full">{title}</span>
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
                                    className="absolute top-0 right-0 w-3 h-full cursor-ew-resize z-[60] group flex items-center justify-center"
                                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                                    onTouchStart={(e) => handleResizeStart(e, 'e')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-blue-500 rounded-full transition-colors" />
                                </div>
                                {/* Bottom Handle */}
                                <div
                                    className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-[60] group flex items-center justify-center"
                                    onMouseDown={(e) => handleResizeStart(e, 's')}
                                    onTouchStart={(e) => handleResizeStart(e, 's')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <div className="w-8 h-0.5 bg-gray-300 group-hover:bg-blue-500 rounded-full transition-colors" />
                                </div>
                                {/* Corner Handle with Icon */}
                                <div
                                    className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[70] group"
                                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                                    onTouchStart={(e) => handleResizeStart(e, 'se')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    {/* Background hover */}
                                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors rounded-tl" />
                                    {/* Resize Icon */}
                                    <div className="absolute bottom-1 right-1 pointer-events-none">
                                        <Maximize2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors rotate-90" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
