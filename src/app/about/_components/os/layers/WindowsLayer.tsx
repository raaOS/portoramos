"use client";

import React from "react";
import OSWindow from "../windows/Window";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";

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
    } = useDesktopWindowContext();

    // Determine which window is on top (highest zIndex) to handle keyboard focus
    const maxZIndex = Math.max(...windows.filter(w => w.isOpen && !w.isMinimized).map(w => w.zIndex || 0), 0);

    return (
        <div className="absolute inset-0 z-20 pointer-events-none w-full h-full pb-20">
            {windows.map(w => (
                <OSWindow
                    key={w.id}
                    id={w.id}
                    isOpen={w.isOpen}
                    title={w.title}
                    isMinimized={w.isMinimized}
                    isFocused={w.isOpen && !w.isMinimized && w.zIndex === maxZIndex && maxZIndex > 0}
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
            ))}
        </div>
    );
}
