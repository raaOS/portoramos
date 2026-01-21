"use client";

import React, { useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { X, Minus, Square } from "lucide-react";

interface WindowProps {
    id: string;
    title: string;
    isOpen: boolean;
    isMinimized?: boolean;
    isMaximized?: boolean;
    minimizeTarget?: { x: number; y: number };
    onClose: () => void;
    onFocus: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    animationVariant?: 'genie' | 'scale' | 'tv' | 'snap';
    children: React.ReactNode;
    zIndex: number;
    noPadding?: boolean;
    initialPosition?: { x: number; y: number };
}

export default function OSWindow({
    id,
    title,
    isOpen,
    isMinimized = false,
    isMaximized = false,
    minimizeTarget,
    onClose,
    onFocus,
    onMinimize,
    onMaximize,
    animationVariant = 'genie',
    children,
    zIndex,
    noPadding = false,
    initialPosition = { x: 100, y: 100 },
}: WindowProps) {
    const winWidth = typeof window !== 'undefined' && window.innerWidth < 768 ? 350 : 600;

    // "Popup Bounce Extreme" Mode + In-Place Minimize
    const getMinimizeState = () => {
        // x and y are REMOVED to create "in-place" minimize effect
        return {
            scale: 0,
            opacity: 0,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            // Extreme Spring for Minimize (Suck in)
            transition: { type: "spring", stiffness: 180, damping: 20 }
        };
    };

    const dragControls = useDragControls();

    return (
        <motion.div
            drag={!isMaximized}
            dragControls={dragControls}
            dragListener={false} // Only drag via controls
            dragMomentum={false}
            initial={{
                scale: 0,
                opacity: 0,
                x: (minimizeTarget?.x ?? 0) - (winWidth / 2),
                y: (minimizeTarget?.y ?? (typeof window !== 'undefined' ? window.innerHeight : 800)) - 100
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
                            width: "100vw",
                            height: "100vh",
                            borderRadius: 0,
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                            filter: "brightness(1)",
                            transition: { type: "spring", stiffness: 150, damping: 20 }
                        }
                        : {
                            scale: 1,
                            opacity: 1,
                            width: winWidth,
                            height: "auto",
                            borderRadius: "0.5rem",
                            x: initialPosition.x,
                            y: initialPosition.y,
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                            filter: "brightness(1)",
                            // Extreme Spring for Popup (Open/Restore)
                            transition: { type: "spring", stiffness: 150, damping: 10 }
                        }
            }
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
            style={{ zIndex, position: "absolute" }}
            onDragStart={onFocus}
            onClick={onFocus}
            className="flex flex-col overflow-hidden font-sans shadow-2xl bg-[#F9F9F9]"
        >
            {/* Title Bar - Light Gray Reference Style */}
            <div
                onPointerDown={(e) => dragControls.start(e)} // Only drag from here
                style={{ touchAction: "none" }}
                className="h-7 bg-[#EFEFEF] border-b border-[#D1D1D1] flex items-center px-3 cursor-grab active:cursor-grabbing select-none"
            >
                {/* Traffic Lights Container */}
                <div className="flex gap-[8px] mr-3 items-center group">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="w-[15px] h-[15px] min-w-[15px] min-h-[15px] p-0 border-none rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors shadow-sm flex items-center justify-center"
                    >
                        <X size={9} className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
                        className="w-[15px] h-[15px] min-w-[15px] min-h-[15px] p-0 border-none rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 transition-colors shadow-sm flex items-center justify-center"
                    >
                        <Minus size={9} className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMaximize?.(); }}
                        className="w-[15px] h-[15px] min-w-[15px] min-h-[15px] p-0 border-none rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors shadow-sm flex items-center justify-center"
                    >
                        {/* Outline Square for Expand */}
                        <Square
                            size={9}
                            className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            strokeWidth={2.5}
                        />
                    </button>
                </div>

                {/* Title */}
                <span className="text-[12px] text-black/80 font-semibold tracking-wide ml-1">
                    {title}
                </span>
            </div>

            {/* Content - White/Light Background */}
            <div
                data-lenis-prevent // CRITICAL: Tells Lenis scroll library to ignore this div
                style={{ touchAction: "auto" }}
                className={`bg-[#F9F9F9] text-gray-800 cursor-default ${noPadding ? '' : 'p-5'} flex flex-col ${isMaximized ? 'flex-1 h-full' : 'min-h-[200px] h-[400px]'
                    } overflow-hidden border-t border-white/50 relative`}>
                {children}
            </div>
        </motion.div>
    );
}
