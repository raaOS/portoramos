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
}

export default function DesktopIcon({ label, icon, imageUrl, videoUrl, onClick, x = 0, y = 0, size = "medium", aspectRatio = 1, children }: DesktopIconProps) {
    const [mediaError, setMediaError] = useState(false);

    // Reset error state when media changes
    useEffect(() => {
        setMediaError(false);
    }, [imageUrl, videoUrl]);

    const baseHeight = {
        small: 64,
        medium: 80,
        large: 96
    }[size];

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            onTap={onClick}
            whileHover={{ scale: 1.1, zIndex: 100 }}
            whileTap={{ scale: 0.9 }}
            dragTransition={{ power: 0, timeConstant: 200 }}
            style={{ position: "absolute", left: x, top: y }}
            className="flex flex-col items-center gap-3 w-auto group cursor-pointer pointer-events-auto"
        >
            {children ? (
                <div className="relative">
                    {children}
                </div>
            ) : (imageUrl || videoUrl) && !mediaError ? (
                <div
                    style={{
                        height: baseHeight,
                        width: "auto",
                        aspectRatio: aspectRatio,
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

            <span className="text-xs text-black font-medium text-center px-2 py-1 bg-white/40 rounded-[4px] backdrop-blur-md shadow-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-200 max-w-[120px] truncate select-none mt-1 z-20">
                {label}
            </span>
        </motion.div>
    );
}
