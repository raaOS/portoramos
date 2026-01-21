"use client";

import React from "react";
import { motion } from "framer-motion";

interface DesktopIconProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    x?: number;
    y?: number;
}

export default function DesktopIcon({ label, icon, onClick, x = 0, y = 0 }: DesktopIconProps) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={false} // Don't animate initial position to prevent flash
            // Since it's a grid, we might not want free drag, but the reference site allows it.
            // For now let's allow free drag but position absolutely.
            style={{ position: "absolute", left: x, top: y }}
            onDoubleClick={onClick}
            className="flex flex-col items-center gap-2 w-24 group cursor-pointer"
        >
            <div className="w-16 h-16 bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 flex items-center justify-center transition-all group-hover:bg-white/10 group-active:scale-95 shadow-lg">
                <div className="text-white/80 group-hover:text-white transition-colors">
                    {icon}
                </div>
            </div>
            <span className="text-xs text-white font-medium text-center px-2 py-1 bg-black/40 rounded-md backdrop-blur-md shadow-sm border border-transparent group-hover:border-white/10">
                {label}
            </span>
        </motion.div>
    );
}
