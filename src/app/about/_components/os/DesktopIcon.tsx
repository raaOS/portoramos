import React, { useState, useEffect } from "react";
import { m, useMotionValue } from "framer-motion";
import Image from "next/image";
import { soundManager } from "./utils/SoundManager";

interface DesktopIconProps {
    id: string;
    label: string;
    icon?: React.ReactNode;
    imageUrl?: string;
    videoUrl?: string;
    onClick: () => void;
    x?: number;
    y?: number;
    size?: "small" | "medium" | "large";
    aspectRatio?: number;
    children?: React.ReactNode;
    priority?: boolean;
    isMobile?: boolean;
    onPositionChange?: (id: string, x: number, y: number) => void;
}

export default function DesktopIcon({ id, label, icon, imageUrl, videoUrl, onClick, x = 0, y = 0, size = "medium", aspectRatio = 1, children, priority = false, isMobile = false, onPositionChange }: DesktopIconProps) {
    const [mediaError, setMediaError] = useState(false);
    const [hovering, setHovering] = useState(false);

    // Reset error state when media changes
    useEffect(() => {
        setMediaError(false);
    }, [imageUrl, videoUrl]);

    // Motion Values for smooth coordinate handling (avoids jump on drag end)
    const iconX = useMotionValue(x);
    const iconY = useMotionValue(y);

    const [isDragging, setIsDragging] = useState(false);

    // Sync MotionValues with props when parent updates them (e.g. initial load or reset)
    useEffect(() => {
        if (isDragging) return; // Don't snap back mid-drag
        iconX.set(x);
        iconY.set(y);
    }, [x, y, iconX, iconY, isDragging]);

    const baseHeight = {
        small: isMobile ? 58 : 64, // ~10% smaller
        medium: isMobile ? 72 : 80, // ~10% smaller
        large: isMobile ? 86 : 96  // ~10% smaller
    }[size];

    const handleDragStart = () => {
        setIsDragging(true);
        soundManager.play('click', 0.3);
    };

    const handleDragEnd = () => {
        setTimeout(() => setIsDragging(false), 50); // Small delay to prevent click firing immediately after drag

        if (onPositionChange) {
            // Because we are using useMotionValue mapped to x/y style, 
            // the .get() value IS the absolute position relative to the nearest relative parent (Desktop container)
            // provided that left/top are 0 (which they are in our style prop below)
            const newX = iconX.get();
            const newY = iconY.get();

            onPositionChange(id, newX, newY);
        }
    };

    return (
        <m.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={(e, info) => {
                // Precision Fix: Use info.point which is relative to the viewport, 
                // but since our style is absolute and top/left are 0, we can calculate delta or use internal values
                handleDragEnd();
            }}
            data-lenis-prevent
            onClick={(e) => {
                if (!isDragging) {
                    soundManager.play('click', 0.4);
                    onClick();
                }
            }}
            // Use motion values for position instead of left/top to prevent "fighting" between Drag transform and React state
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x: iconX,
                y: iconY
            }}
            className={`flex flex-col items-center gap-3 w-auto group cursor-pointer pointer-events-auto`}
            whileHover={!isMobile ? { scale: 1.1 } : undefined}
            whileTap={!isMobile ? { scale: 0.95 } : undefined}
            onMouseEnter={() => !isMobile && setHovering(true)}
            onMouseLeave={() => !isMobile && setHovering(false)}
        >
            {children ? (
                <div className="relative">
                    {children}
                </div>
            ) : (imageUrl || videoUrl) && !mediaError ? (
                <div
                    style={{
                        height: baseHeight,
                        width: baseHeight * aspectRatio,
                        minWidth: baseHeight * aspectRatio,
                        minHeight: baseHeight,
                    }}
                    className={`relative shadow-lg border-2 border-white/40 group-hover:border-white/60 transition-colors bg-white/20 overflow-hidden`}
                >
                    {/* Always render Image as base layer */}
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={label}
                            fill
                            className={`object-cover pointer-events-none transition-opacity duration-300 ${hovering && videoUrl ? 'opacity-0' : 'opacity-100'}`}
                            sizes="(max-width: 768px) 96px, 128px"
                            draggable={false}
                            onError={() => setMediaError(true)}
                            priority={priority} // Important for LCP
                            loading={priority ? "eager" : "lazy"}
                            quality={60} // Thumbnails don't need 100% quality
                        />
                    )}

                    {/* Only render Video if hovering and video exists (and not mobile) */}
                    {videoUrl && hovering && !isMobile && (
                        <video
                            src={videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 object-cover w-full h-full pointer-events-none rounded-none"
                            draggable={false}
                            onError={() => setMediaError(true)}
                        />
                    )}
                </div>
            ) : (
                <div className={`w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center justify-center transition-colors group-hover:bg-white/30 shadow-lg`}>
                    <div className="text-black/80 group-hover:text-black transition-colors">
                        {icon}
                    </div>
                </div>
            )}

            {isMobile ? (
                <span className="text-[10px] text-white font-medium text-center px-1.5 py-0.5 bg-black/30 rounded backdrop-blur-sm max-w-[80px] truncate select-none mt-1 z-20">
                    {label}
                </span>
            ) : (
                <span className={`text-xs text-black font-medium text-center px-2 py-1 bg-white/40 rounded-[4px] backdrop-blur-md shadow-sm border border-white/30 transition-all duration-200 max-w-[120px] truncate select-none mt-1 z-20 opacity-0 group-hover:opacity-100`}>
                    {label}
                </span>
            )}
        </m.div>
    );
}
