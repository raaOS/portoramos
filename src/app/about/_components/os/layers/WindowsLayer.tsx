"use client";

import React from "react";
import { m, LayoutGroup } from "framer-motion";
import OSWindow from "../windows/Window";
import { useDesktopWindowContext } from "../context/DesktopWindowContext";

interface WindowsLayerProps {
    isAdmin: boolean;
    isReady?: boolean;
}

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

    // Determine which window is on top (highest zIndex) to handle keyboard focus
    const maxZIndex = Math.max(...windows.filter(w => w.isOpen && !w.isMinimized).map(w => w.zIndex || 0), 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,   // 200ms delay between each window dropping
                delayChildren: 1.8,    // Windows start 1.8s after icons to ensure the hole is fully open
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -40
        },
        show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20,
                mass: 1
            }
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
                    <OSWindow
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
                </m.div>
            ))}

        </m.div>
    );
}
