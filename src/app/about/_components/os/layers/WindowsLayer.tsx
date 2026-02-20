"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import OSWindow from "../Window";
import type { WindowState } from "@/hooks/useWindowManager";
import { useWindowContext } from "../context/WindowContext";

interface WindowsLayerProps {
    isAdmin: boolean;
}

export default function WindowsLayer({ isAdmin }: WindowsLayerProps) {
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
    } = useWindowContext();
    return (
        <div className="absolute inset-0 z-20 pointer-events-none">
            <AnimatePresence>
                {windows.map(w => (
                    w.isOpen && !w.isMinimized && (
                        <OSWindow
                            key={w.id}
                            id={w.id}
                            isOpen={w.isOpen}
                            title={w.title}
                            isMinimized={w.isMinimized}
                            onClose={() => closeWindow(w.id)}
                            onMinimize={() => minimizeWindow(w.id)}
                            onMaximize={() => maximizeWindow(w.id)}
                            onFocus={() => focusWindow(w.id)}
                            onUpdatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
                            onResize={(width, height) => handleWindowResize(w.id, width, height)}
                            onResizeEnd={(width, height) => handleWindowResizeEnd(w.id, width, height)}
                            isPinned={isAdmin && w.isPinned}
                            onTogglePin={isAdmin ? () => togglePin(w.id) : undefined}
                            isAdmin={isAdmin}
                            initialPosition={w.initialPosition}
                            width={w.width || 800}
                            height={w.height || 600}
                            zIndex={w.zIndex}
                            noPadding={w.noPadding}
                        >
                            {w.content}
                        </OSWindow>
                    )
                ))}
            </AnimatePresence>
        </div>
    );
}
