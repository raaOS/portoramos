"use client";

import React, { useRef } from "react";
import { motion, useDragControls, AnimatePresence } from "framer-motion";
import { X, Minus, Square } from "lucide-react";

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
    animationVariant = 'genie',
}: WindowProps) {
    const winWidth = typeof window !== 'undefined' && window.innerWidth < 768 ? 350 : 600;
    const dragControls = useDragControls();

    // Internal state for resizing
    const [isResizing, setIsResizing] = React.useState(false);

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
    const handleResizeStart = (e: React.MouseEvent, direction: 'e' | 's' | 'se') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = width || 0;
        const startHeight = height || 0;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!onResize) return;

            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction === 'e' || direction === 'se') {
                newWidth = Math.max(300, startWidth + deltaX);
            }
            if (direction === 's' || direction === 'se') {
                newHeight = Math.max(200, startHeight + deltaY);
            }

            onResize(newWidth, newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    drag={!isMaximized && !isResizing} // Disable drag when resizing
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(e, info) => {
                        // We only want to update position if NOT maximizing/minimizing
                        if (!isMaximized && !isMinimized && onUpdatePosition) {
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
                                    width: width || winWidth, // Use prop width if available
                                    height: height || "auto", // Use prop height if available
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
                    className="flex flex-col bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/40 will-change-transform"
                >
                    {/* Title Bar */}
                    <div
                        onPointerDown={(e) => {
                            if (!isMaximized) dragControls.start(e);
                        }}
                        onDoubleClick={onMaximize}
                        className="h-7 bg-[#EFEFEF] border-b border-[#D1D1D1] flex items-center justify-between px-3 shrink-0 cursor-default select-none relative z-50"
                    >
                        {/* Traffic Lights */}
                        <div className="flex gap-[8px] mr-3 items-center group">
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="w-[12px] h-[12px] min-w-[12px] min-h-[12px] p-0 border-[0.5px] border-[#D6443F] rounded-full bg-[#FF5F57] hover:bg-[#FF5F57] transition-all shadow-sm flex items-center justify-center group-hover:brightness-90 active:brightness-75"
                            >
                                <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMinimize && onMinimize(); }}
                                className="w-[12px] h-[12px] min-w-[12px] min-h-[12px] p-0 border-[0.5px] border-[#DDA335] rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E] transition-all shadow-sm flex items-center justify-center group-hover:brightness-90 active:brightness-75"
                            >
                                <Minus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize(); }}
                                className="w-[12px] h-[12px] min-w-[12px] min-h-[12px] p-0 border-[0.5px] border-[#22AA32] rounded-full bg-[#28C840] hover:bg-[#28C840] transition-all shadow-sm flex items-center justify-center group-hover:brightness-90 active:brightness-75"
                            >
                                {/* Outline Square for Expand */}
                                <div className="w-[6px] h-[6px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rotate-45 transform scale-[0.8]" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
                            </button>
                        </div>

                        {/* Title */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-80 pointer-events-none">
                            {/* <Folder size={12} className="text-gray-600" fill="currentColor" /> */}
                            <span className="text-xs font-semibold text-gray-700 tracking-wide drop-shadow-sm">{title}</span>
                        </div>

                        {/* Spacer */}
                        <div className="w-12" />
                    </div>

                    {/* Window Content */}
                    <div
                        data-lenis-prevent
                        style={{ touchAction: "auto" }}
                        className={`relative flex-1 bg-white/50 w-full overflow-hidden ${noPadding ? '' : 'p-4'}`}
                    >
                        {children}

                        {/* Safe Zone for Resize Overlays (Only if not maximized and resizable) */}
                        {!isMaximized && onResize && (
                            <>
                                {/* Right Handle */}
                                <div
                                    className="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize z-[60] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, 'e')}
                                />
                                {/* Bottom Handle */}
                                <div
                                    className="absolute bottom-0 left-0 w-full h-1.5 cursor-ns-resize z-[60] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, 's')}
                                />
                                {/* Corner Handle */}
                                <div
                                    className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-[70] hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors rounded-tl"
                                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                                />
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
