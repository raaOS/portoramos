"use client";

import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

interface DockItemProps {
    id: string; // Add ID prop
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    mouseX: any;
    isOpen?: boolean;
}

function DockItem({ id, icon, label, onClick, mouseX, isOpen = false }: DockItemProps) {
    const ref = React.useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const [isBouncing, setIsBouncing] = React.useState(false);

    const handleClick = () => {
        setIsBouncing(true);
        onClick();
        setTimeout(() => setIsBouncing(false), 2000);
    };

    const shouldBounce = isOpen || isBouncing;

    return (
        <motion.div
            id={`dock-item-${id}`} // DOM ID for targeting
            ref={ref}
            style={{ width, height: width }}
            animate={shouldBounce ? { y: [0, -20, 0] } : { y: 0 }}
            transition={shouldBounce
                ? {
                    duration: isOpen ? 0.75 : 0.4,
                    repeat: isOpen ? Infinity : 0,
                    repeatDelay: isOpen ? 0.1 : 0,
                    ease: "easeInOut"
                }
                : { type: "spring", mass: 0.1, stiffness: 150, damping: 12 }
            }
            onClick={handleClick}
            className="aspect-square rounded-2xl flex items-center justify-center cursor-pointer relative group"
        >
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                {label}
            </div>
            <div className="flex items-center justify-center w-full h-full">
                {/* We scale the icon inside to keep it looking nice */}
                {React.cloneElement(icon as React.ReactElement, { className: "w-full h-full" })}
            </div>
        </motion.div>
    );
}

interface DockProps {
    items: { id: string; label: string; icon: React.ReactNode; onClick: () => void; isOpen?: boolean }[];
}

export default function Dock({ items }: DockProps) {
    const mouseX = useMotionValue(Infinity);

    return (
        <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
        >
            <div className="flex items-end gap-3 px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                {items.map((item) => (
                    <DockItem
                        key={item.id}
                        id={item.id} // Pass ID
                        icon={item.icon}
                        label={item.label}
                        onClick={item.onClick}
                        mouseX={mouseX}
                        isOpen={item.isOpen}
                    />
                ))}
            </div>
        </div>
    );
}
