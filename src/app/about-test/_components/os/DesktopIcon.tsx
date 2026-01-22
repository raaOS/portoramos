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
}

export default function DesktopIcon({ label, icon, imageUrl, videoUrl, onClick, x = 0, y = 0, size = "medium", aspectRatio = 1 }: DesktopIconProps) {
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
            initial={false}
            style={{ position: "absolute", left: x, top: y }}
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-2 w-auto group cursor-pointer"
        >
            {(imageUrl || videoUrl) && !mediaError ? (
                <div
                    style={{
                        height: baseHeight,
                        width: "auto",
                        aspectRatio: aspectRatio,
                    }}
                    className={`relative shadow-lg border-2 border-white/20 group-hover:border-white/40 transition-colors bg-gray-900/50`}
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
                <div className={`w-16 h-16 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 flex items-center justify-center transition-colors group-hover:bg-white/10 shadow-lg`}>
                    <div className="text-white/80 group-hover:text-white transition-colors">
                        {icon}
                    </div>
                </div>
            )}

            <span className="text-xs text-white font-medium text-center px-2 py-1 bg-black/40 rounded-md backdrop-blur-md shadow-sm border border-transparent group-hover:border-white/10 max-w-[120px] truncate select-none">
                {label}
            </span>
        </motion.div>
    );
}
