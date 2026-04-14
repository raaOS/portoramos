"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { m, useDragControls, AnimatePresence } from "framer-motion";
import { soundManager } from "../utils/SoundManager";
import { useWindowResize } from "../hooks/useWindowResize";
import { useWindowKeyboard } from "../hooks/useWindowKeyboard";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { WindowResizeHandles } from "./components/WindowResizeHandles";
import { resolveDockTarget } from "../utils/windowMotion";

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
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
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
            windowRef.current.focus({ preventScroll: true });
        }
    }, [isFocused]);

    const measuredWidth = dynamicSize.width || width || winWidth;
    const measuredHeight = dynamicSize.height || height || 600;
    const dockTarget = resolveDockTarget(id);

    const normalFrame = useMemo(() => ({
        x: initialPosition.x,
        y: initialPosition.y,
        width: measuredWidth,
        height: measuredHeight,
    }), [initialPosition.x, initialPosition.y, measuredWidth, measuredHeight]);

    const maximizedFrame = useMemo(() => ({
        x: 10,
        y: 36,
        width: Math.max(viewportWidth - 20, 320),
        height: Math.max(viewportHeight - 46, 240),
    }), [viewportWidth, viewportHeight]);

    const activeFrame = isMaximized ? maximizedFrame : normalFrame;
    const dockScale = isSmallScreen ? 0.24 : 0.18;
    const dockTopLeft = dockTarget
        ? {
            x: dockTarget.x - activeFrame.width / 2,
            y: dockTarget.y - activeFrame.height / 2,
        }
        : { x: activeFrame.x, y: activeFrame.y };

    const transformOrigin = isMaximized ? "50% 50%" : "50% 50%";

    const shellStyle = {
        backgroundColor: isMaximized ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.80)",
        filter: "blur(0px) saturate(1)",
    } as const;

    const minimizedStyle = {
        backgroundColor: "rgba(255,255,255,0.62)",
        filter: "blur(10px) saturate(0.9)",
    } as const;

    const entryState = {
        x: activeFrame.x,
        y: activeFrame.y,
        scale: 0.8,
        opacity: 0,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.70)",
        filter: "blur(4px) saturate(0.92)",
    };

    const minimizedState = {
        x: activeFrame.x,
        y: activeFrame.y,
        scale: 0.8,
        opacity: 0,
        borderRadius: 26,
        ...minimizedStyle,
    };

    const activeState = {
        x: activeFrame.x,
        y: activeFrame.y,
        scale: 1,
        opacity: 1,
        width: activeFrame.width,
        height: activeFrame.height,
        borderRadius: isMaximized ? 14 : 18,
        ...shellStyle,
    };

    const standardTransition = {
        x: { type: "spring", stiffness: 450, damping: 28, mass: 1 },
        y: { type: "spring", stiffness: 450, damping: 28, mass: 1 },
        scale: { type: "spring", stiffness: 500, damping: 22, mass: 0.85 },
        width: { type: "spring", stiffness: 350, damping: 30, mass: 1 },
        height: { type: "spring", stiffness: 350, damping: 30, mass: 1 },
        opacity: { duration: 0.20, ease: "easeOut" },
        borderRadius: { duration: 0.22, ease: "easeOut" },
        filter: { duration: 0.22, ease: "easeOut" },
        backgroundColor: { duration: 0.22, ease: "easeOut" },
    } as const;

    const minimizeTransition = {
        x: { type: "spring", stiffness: 450, damping: 30, mass: 1 },
        y: { type: "spring", stiffness: 450, damping: 30, mass: 1 },
        scale: { type: "spring", stiffness: 500, damping: 24, mass: 0.8 },
        opacity: { duration: 0.18, ease: "easeInOut" },
        borderRadius: { duration: 0.2, ease: "easeInOut" },
        filter: { duration: 0.2, ease: "easeInOut" },
        backgroundColor: { duration: 0.2, ease: "easeInOut" },
    } as const;

    const exitState = {
        scale: 0.85,
        opacity: 0,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.66)",
        filter: "blur(4px) saturate(0.92)",
        transition: {
            opacity: { duration: 0.12 },
            scale: { type: "spring", stiffness: 450, damping: 30 },
            filter: { duration: 0.12 },
        },
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
                        ...entryState,
                        width: activeFrame.width,
                        height: activeFrame.height,
                    }}
                    animate={isMinimized ? minimizedState : activeState}
                    transition={isResizing ? { duration: 0 } : (isMinimized ? minimizeTransition : standardTransition)}
                    exit={exitState}
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
                        transformOrigin,
                        pointerEvents: isMinimized ? "none" : "auto",
                        backdropFilter: isMinimized ? "none" : (isFocused ? "blur(24px) saturate(1.2)" : "blur(12px) saturate(1)"),
                        transition: "backdrop-filter 0.3s ease",
                    }}
                    data-lenis-prevent
                    className="flex flex-col overflow-hidden border border-white/45 will-change-transform rounded-[18px] outline-none"
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
                        onFocus={onFocus}
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
