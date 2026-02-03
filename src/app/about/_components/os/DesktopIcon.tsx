import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

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
    priority?: boolean; // For LCP optimization
    isMobile?: boolean;
}

export default function DesktopIcon({ label, icon, imageUrl, videoUrl, onClick, x = 0, y = 0, size = "medium", aspectRatio = 1, children, priority = false, isMobile = false }: DesktopIconProps) {
    const [mediaError, setMediaError] = useState(false);

    // Reset error state when media changes
    useEffect(() => {
        setMediaError(false);
    }, [imageUrl, videoUrl]);

    const baseHeight = {
        small: isMobile ? 58 : 64, // ~10% smaller
        medium: isMobile ? 72 : 80, // ~10% smaller
        large: isMobile ? 86 : 96  // ~10% smaller
    }[size];

    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setTimeout(() => setIsDragging(false), 50); // Small delay to prevent click firing immediately after drag
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                if (!isDragging) {
                    onClick();
                }
            }}
            // Using CSS transforms instead of framer-motion scale to avoid CLS
            dragTransition={{ power: 0, timeConstant: 200 }}
            style={{ position: "absolute", left: x, top: y }}
            className={`flex flex-col items-center gap-3 w-auto group cursor-pointer pointer-events-auto transition-transform duration-150 ${!isMobile ? 'hover:scale-110 active:scale-95' : ''}`}
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
                    className={`relative shadow-lg border-2 border-white/40 group-hover:border-white/60 transition-colors bg-white/20`}
                >
                    {videoUrl ? (
                        <video
                            src={videoUrl}
                            poster={imageUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="object-cover w-full h-full pointer-events-none rounded-none"
                            draggable={false}
                            onError={() => setMediaError(true)}
                        />
                    ) : (
                        <Image
                            src={imageUrl!}
                            alt={label}
                            fill
                            className="object-cover pointer-events-none"
                            sizes="(max-width: 768px) 150px, 200px"
                            draggable={false}
                            onError={() => setMediaError(true)}
                            priority={priority}
                            loading={priority ? "eager" : "lazy"}
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

            {!isMobile && (
                <span className={`text-xs text-black font-medium text-center px-2 py-1 bg-white/40 rounded-[4px] backdrop-blur-md shadow-sm border border-white/30 transition-all duration-200 max-w-[120px] truncate select-none mt-1 z-20 opacity-0 group-hover:opacity-100`}>
                    {label}
                </span>
            )}
        </motion.div>
    );
}
