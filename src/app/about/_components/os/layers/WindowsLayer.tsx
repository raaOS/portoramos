"use client";

import React, { useMemo, useCallback } from "react";
import { m } from "motion/react";
import OSWindow from "../windows/Window";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";
import type { WindowState } from "@/hooks/window-manager/types";

interface WindowsLayerProps {
    isAdmin: boolean;
    isReady?: boolean;
}

/**
 * Memoized wrapper for each window to stabilize callback references.
 * Without this, every render creates new inline arrows like `() => closeWindow(w.id)`,
 * causing every OSWindow to re-render even when only one window changes.
 */
const WindowItem = React.memo(function WindowItem({
    w,
    isAdmin,
    isFocused,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    handleWindowResize,
    handleWindowResizeEnd,
    togglePin,
}: {
    w: WindowState;
    isAdmin: boolean;
    isFocused: boolean;
    closeWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    maximizeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    updateWindowPosition: (id: string, x: number, y: number) => void;
    handleWindowResize: (id: string, w: number, h: number) => void;
    handleWindowResizeEnd: (id: string, w: number, h: number) => void;
    togglePin: (id: string) => void;
}) {
    const onClose = useCallback(() => closeWindow(w.id), [closeWindow, w.id]);
    const onMinimize = useCallback(() => minimizeWindow(w.id), [minimizeWindow, w.id]);
    const onMaximize = useCallback(() => maximizeWindow(w.id), [maximizeWindow, w.id]);
    const onFocus = useCallback(() => focusWindow(w.id), [focusWindow, w.id]);
    const onUpdatePosition = useCallback((x: number, y: number) => updateWindowPosition(w.id, x, y), [updateWindowPosition, w.id]);
    const onResize = useCallback((width: number, height: number) => handleWindowResize(w.id, width, height), [handleWindowResize, w.id]);
    const onResizeEnd = useCallback((width: number, height: number) => handleWindowResizeEnd(w.id, width, height), [handleWindowResizeEnd, w.id]);
    const onTogglePin = useMemo(() => isAdmin ? () => togglePin(w.id) : undefined, [isAdmin, togglePin, w.id]);

    return (
        <OSWindow
            id={w.id}
            isOpen={w.isOpen}
            title={w.title}
            isMinimized={w.isMinimized}
            isFocused={isFocused}
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            onFocus={onFocus}
            onUpdatePosition={onUpdatePosition}
            onResize={onResize}
            onResizeEnd={onResizeEnd}
            isPinned={isAdmin && w.isPinned}
            onTogglePin={onTogglePin}
            isAdmin={isAdmin}
            initialPosition={w.initialPosition}
            width={w.width || 800}
            height={w.height || 600}
            zIndex={w.zIndex}
            noPadding={w.noPadding}
        >
            {w.content}
        </OSWindow>
    );
});

export default function WindowsLayer({ isAdmin, isReady = true }: WindowsLayerProps) {
    const {
        windows,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        focusWindow,
        updateWindowPosition,
        handleWindowResize,
        handleWindowResizeEnd,
        togglePin
    } = useDesktopWindowContext();

    // Memoize to avoid recomputing on every render
    const maxZIndex = useMemo(
        () => Math.max(...windows.filter(w => w.isOpen && !w.isMinimized).map(w => w.zIndex || 0), 0),
        [windows]
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,   // Faster staggering for snappier feel
                delayChildren: 1.5,      // Reduced delay for better UX
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
        },
        show: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 450,
                damping: 28,
            } as any
        }
    };

    return (
        <m.div
            className="absolute inset-0 pointer-events-none w-full h-full pb-20"
            variants={containerVariants}
            initial="hidden"
            animate={isReady ? "show" : "hidden"}
        >
            {windows.map(w => (
                <m.div key={w.id} variants={itemVariants} className="pointer-events-none" layout={false}>
                    <WindowItem
                        w={w}
                        isAdmin={isAdmin}
                        isFocused={w.isOpen && !w.isMinimized && w.zIndex === maxZIndex && maxZIndex > 0}
                        closeWindow={closeWindow}
                        minimizeWindow={minimizeWindow}
                        maximizeWindow={maximizeWindow}
                        focusWindow={focusWindow}
                        updateWindowPosition={updateWindowPosition}
                        handleWindowResize={handleWindowResize}
                        handleWindowResizeEnd={handleWindowResizeEnd}
                        togglePin={togglePin}
                    />
                </m.div>
            ))}

        </m.div>
    );
}
