"use client";

import React, { useRef, useEffect } from "react";
import { m, useDragControls, AnimatePresence } from "framer-motion";
import { soundManager } from "../utils/SoundManager";
import { useWindowResize } from "../hooks/useWindowResize";
import { useWindowKeyboard } from "../hooks/useWindowKeyboard";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { WindowResizeHandles } from "./components/WindowResizeHandles";

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
    animationVariant: _animationVariant,
}: WindowProps) {
    const windowRef = useRef<HTMLDivElement>(null);
    const isMobileWindow = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTabletWindow = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const isSmallScreen = isMobileWindow || isTabletWindow;
    const winWidth = isMobileWindow ? window.innerWidth : isTabletWindow ? Math.min(window.innerWidth - 32, 700) : 600;
    const dragControls = useDragControls();

    const { handleKeyDown } = useWindowKeyboard({ onClose, onMinimize, onMaximize });
    const { dynamicSize, isResizing, handleResizeStart } = useWindowResize({
        initialWidth: width,
        initialHeight: height,
        onResize,
        onResizeEnd
    });

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
                                    borderRadius: "12px",
                                }
                                : {
                                    // Jelly/Playful entry keyframes (squash & stretch)
                                    scale: [0.4, 1.2, 0.9, 1.05, 1], // Pop -> Overshoot -> Bounce back -> Settle
                                    opacity: 1,
                                    x: initialPosition.x,
                                    y: initialPosition.y,
                                    width: dynamicSize.width || width || winWidth,
                                    height: dynamicSize.height || height || "auto",
                                    borderRadius: "10px",
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
                    onKeyDown={handleKeyDown}
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
                    className={`flex flex-col overflow-hidden border border-white/40 will-change-transform pointer-events-auto rounded-lg outline-none bg-white`}
                >
                    {/* Title Bar */}
                    <WindowTitleBar
                        title={title}
                        isMaximized={isMaximized}
                        isPinned={isPinned}
                        isAdmin={isAdmin}
                        onClose={onClose}
                        onMinimize={onMinimize}
                        onMaximize={onMaximize}
                        onTogglePin={onTogglePin}
                        onDragStart={(e) => dragControls.start(e)}
                    />

                    {/* Window Content */}
                    <div
                        data-lenis-prevent
                        style={{ touchAction: "auto" }}
                        className={`relative flex-1 bg-white/50 w-full overflow-hidden ${noPadding ? '' : 'p-4'}`}
                    >
                        {children}

                        {/* Safe Zone for Resize Overlays (Only if not maximized and resizable) */}
                        {!isMaximized && !isSmallScreen && onResize && (
                            <WindowResizeHandles onResizeStart={handleResizeStart} />
                        )}
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
}
