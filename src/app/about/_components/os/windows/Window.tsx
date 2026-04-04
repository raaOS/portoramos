"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { m, useDragControls, AnimatePresence } from "framer-motion";
import { soundManager } from "../utils/SoundManager";
import { useWindowResize } from "../hooks/useWindowResize";
import { useWindowKeyboard } from "../hooks/useWindowKeyboard";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { WindowResizeHandles } from "./components/WindowResizeHandles";
import { getTransformOrigin, resolveDockTarget } from "../utils/windowMotion";

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

    const transformOrigin = getTransformOrigin(
        activeFrame,
        dockTarget,
        isMaximized ? "50% 20px" : "50% 26px"
    );

    const shellStyle = {
        backgroundColor: isMaximized ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.80)",
        boxShadow: isMaximized
            ? "0 20px 46px rgba(15, 23, 42, 0.20), 0 4px 18px rgba(15, 23, 42, 0.10)"
            : "0 26px 60px rgba(15, 23, 42, 0.24), 0 8px 24px rgba(15, 23, 42, 0.12)",
        filter: "blur(0px) saturate(1)",
    } as const;

    const minimizedStyle = {
        backgroundColor: "rgba(255,255,255,0.62)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
        filter: "blur(10px) saturate(0.9)",
    } as const;

    const entryState = dockTarget
        ? {
            x: dockTopLeft.x,
            y: dockTopLeft.y,
            scale: dockScale * 0.9,
            opacity: 0,
            borderRadius: 24,
            ...minimizedStyle,
        }
        : {
            x: activeFrame.x,
            y: activeFrame.y + 18,
            scale: 0.94,
            opacity: 0,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,0.70)",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.10)",
            filter: "blur(10px) saturate(0.92)",
        };

    const minimizedState = {
        x: dockTopLeft.x,
        y: dockTopLeft.y,
        scale: dockScale,
        opacity: 0.04,
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
        x: { type: "spring", stiffness: 280, damping: 30, mass: 0.92 },
        y: { type: "spring", stiffness: 280, damping: 30, mass: 0.92 },
        scale: { type: "spring", stiffness: 260, damping: 28, mass: 0.88 },
        width: { type: "spring", stiffness: 240, damping: 30, mass: 0.96 },
        height: { type: "spring", stiffness: 240, damping: 30, mass: 0.96 },
        opacity: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
        borderRadius: { duration: 0.26, ease: [0.32, 0.72, 0, 1] },
        boxShadow: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        filter: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
        backgroundColor: { duration: 0.24, ease: [0.32, 0.72, 0, 1] },
    } as const;

    const minimizeTransition = {
        x: { type: "spring", stiffness: 340, damping: 34, mass: 0.82 },
        y: { type: "spring", stiffness: 340, damping: 34, mass: 0.82 },
        scale: { type: "spring", stiffness: 300, damping: 28, mass: 0.78 },
        opacity: { duration: 0.18, ease: [0.4, 0, 1, 1] },
        borderRadius: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        boxShadow: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        filter: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        backgroundColor: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    } as const;

    const exitState = dockTarget
        ? {
            x: dockTopLeft.x,
            y: dockTopLeft.y,
            scale: dockScale * 0.82,
            opacity: 0,
            borderRadius: 28,
            ...minimizedStyle,
            transition: minimizeTransition,
        }
        : {
            x: activeFrame.x,
            y: activeFrame.y + 12,
            scale: 0.92,
            opacity: 0,
            borderRadius: 26,
            backgroundColor: "rgba(255,255,255,0.66)",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
            filter: "blur(8px) saturate(0.92)",
            transition: {
                opacity: { duration: 0.18, ease: [0.4, 0, 1, 1] },
                scale: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                y: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                borderRadius: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                boxShadow: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                filter: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                backgroundColor: { duration: 0.2, ease: [0.4, 0, 1, 1] },
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
                    }}
                    data-lenis-prevent
                    className="flex flex-col overflow-hidden border border-white/45 will-change-transform rounded-[18px] outline-none backdrop-blur-xl"
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
