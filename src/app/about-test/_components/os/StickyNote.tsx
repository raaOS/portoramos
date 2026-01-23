"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface StickyNoteProps {
    id: string;
    initialX?: number;
    initialY?: number;
    text?: string;
    rotation?: number;
    onDelete: (id: string) => void;
    // We can remove passed color since it's now locally managed or we can keep it as initial
    color?: string;
}

const COLORS = [
    { name: 'yellow', class: 'bg-[#fef08a]' }, // yellow-200
    { name: 'blue', class: 'bg-[#bfdbfe]' },   // blue-200
    { name: 'green', class: 'bg-[#bbf7d0]' },  // green-200
    { name: 'pink', class: 'bg-[#fbcfe8]' },   // pink-200
    { name: 'white', class: 'bg-[#f5f5f4]' },  // stone-100
];

export default function StickyNote({ id, initialX = 100, initialY = 100, text = "", color = "bg-[#fef08a]", rotation = 0, onDelete }: StickyNoteProps) {
    const [currentColor, setCurrentColor] = useState(color);
    const [isHovered, setIsHovered] = useState(false);

    // Determines text color based on background luminance (simple check)
    // For these pastel colors, gray-800 is always safe.

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ x: initialX, y: initialY, rotate: rotation, scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                absolute w-52 h-52 
                flex flex-col items-start justify-start 
                cursor-move pointer-events-auto z-20 
                transition-colors duration-300
            `}
            style={{
                backgroundColor: currentColor.replace('bg-', ''), // Hacky if passing Tailwind classes, better to use hex or style map. Let's assume hex in COLORS for now. 
                // Wait, the props passed might be tailwind classes like 'bg-yellow-200'. 
                // Let's standardise on passing hex or mapping it. safely.
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Real Visuals Layer - rendering the Tailwind color is tricky with arbitrary values if we want smooth trans 
                Actually, simpler approach: Use the `style` prop for background color if we use HEX codes.
                Updating props to use HEX mapping or stick to Tailwind classes.
            */}
            <div className={`absolute inset-0 ${currentColor} shadow-xl`} style={{
                boxShadow: "2px 10px 20px rgba(0,0,0,0.15), 0px 2px 6px rgba(0,0,0,0.1)",
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)" // Cut the corner
            }}>
                {/* Texture Overlay */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")` }}
                />

                {/* Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/40 rotate-1 backdrop-blur-[1px] shadow-sm transform" style={{ clipPath: "polygon(2% 0, 100% 2%, 98% 100%, 0% 98%)" }} />
            </div>

            {/* Folded Corner (Dog Ear) - Needs to be distinct from the clipped container to have its own shadow/color */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6"
                style={{
                    backgroundColor: "rgba(255,255,255,0.9)", // Solid-ish, barely transparent for blending
                    borderRadius: "4px 0 0 0",
                    boxShadow: "-1px -1px 2px rgba(0,0,0,0.1)" // Simple shadow
                }}
            >
                <div className="absolute inset-0 border-t border-l border-black/5" style={{
                    clipPath: "polygon(0 0, 0 100%, 100% 0)",
                }} />
            </div>

            {/* Content Container */}
            <div className="relative w-full h-full p-5 flex flex-col z-10">

                {/* Toolbar (Delete + Colors) */}
                <div className={`absolute -top-7 left-0 w-full flex items-center justify-between px-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Color Picker */}
                    <div className="flex gap-1 bg-white/80 p-1 rounded-full shadow-md backdrop-blur-sm">
                        {COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={(e) => { e.stopPropagation(); setCurrentColor(c.class); }}
                                className={`w-2.5 h-2.5 rounded-full border border-black/10 transition-transform hover:scale-125 ${c.class}`}
                                title={c.name}
                            />
                        ))}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id);
                        }}
                        className="p-1 bg-white/80 rounded-full hover:bg-white text-red-500 shadow-md backdrop-blur-sm transition-transform hover:scale-110"
                    >
                        <X size={12} />
                    </button>
                </div>


                {/* Text Content */}
                <div
                    className="w-full h-full bg-transparent border-none text-gray-800 font-handwriting text-base leading-snug whitespace-pre-wrap overflow-hidden select-none cursor-move pt-2"
                    style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
                    onPointerDown={(e) => e.stopPropagation()} // Allow selecting text? No, user wanted Read Only but maybe select is okay. Drag propagation might be needed to move it.
                // If we stop propagation on text, we can't drag by clicking text.
                // Ideally: Drag works everywhere. Text is selectable but readOnly.
                >
                    {text}
                </div>
            </div>
        </motion.div>
    );
}
