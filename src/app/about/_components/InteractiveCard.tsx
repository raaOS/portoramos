'use client';

import React, { useRef } from 'react';
import styles from './InteractiveCard.module.css';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface InteractiveCardProps {
    number: string;
    title: string;
    desc: string;
    quote: string;
}

export default function InteractiveCard({ number, title, desc, quote }: InteractiveCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Mouse position values
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Physics springs for smooth, weighted movement
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

    // Map mouse position to rotation (Degrees)
    // Moving mouse left (negative X) -> Rotates Y negative (tilted left)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["20deg", "-20deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-20deg", "20deg"]);

    // Dynamic Glare Effect
    // As card rotates, the glare moves in opposition to simulate light source reflection
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

    // Scale on hover
    const scale = useSpring(1, { stiffness: 150, damping: 15 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        // Calculate dimensions
        const width = rect.width;
        const height = rect.height;

        // Calculate mouse position relative to center of card
        // Range: -0.5 to 0.5
        const mouseX = (e.clientX - rect.left) / width - 0.5;
        const mouseY = (e.clientY - rect.top) / height - 0.5;

        x.set(mouseX);
        y.set(mouseY);
        scale.set(1.02); // Slight scale up on hover
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);
    };

    return (
        <div
            className={styles['container-cards']}
            style={{ perspective: "1200px" }} // Ensure perspective is set for 3D
        >
            <motion.div
                ref={ref}
                className={styles.card}
                style={{
                    rotateX,
                    rotateY,
                    scale,
                    transformStyle: "preserve-3d",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Dynamic Glare Layer */}
                <motion.div
                    className={styles['light-shadow']}
                    style={{
                        background: `radial-gradient(circle at ${50 + x.get() * 100}% ${50 + y.get() * 100}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
                        opacity: useTransform(scale, [1, 1.02], [0, 0.3]) // Only show glare on hover
                    }}
                />

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full justify-end select-none pointer-events-none">

                    {/* Top Section: Icon & Header */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 shadow-sm transition-colors group-hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    {/* Middle Section: Main Content */}
                    <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-black uppercase tracking-wider">
                                Step
                            </span>
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {number}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white leading-tight">
                            {title}
                        </h3>

                        <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-4 font-medium">
                            {desc}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t-2 border-dashed border-white/20 my-3" />

                    {/* Bottom Section: Footer / Quote */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
                                Philosophy
                            </p>
                            <p className="text-xs font-semibold text-gray-300 italic">
                                "{quote}"
                            </p>
                        </div>

                        {/* QR Code / Signature Simulation */}
                        <div className="w-10 h-10 flex-shrink-0 text-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2zM15 15h2v2h-2v-2z" />
                                <path d="M17 17h2v2h-2v-2zM19 19h2v2h-2v-2zM15 19h2v2h-2v-2zM17 21h2v2h-2v-2z" />
                                <path d="M19 15h2v2h-2v-2zM15 17h2v2h-2v-2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
