'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import React, { useRef } from 'react';

interface InteractiveCardProps {
    number: string;
    title: string;
    desc: string;
    quote: string;
}

export default function InteractiveCard({ number, title, desc, quote }: InteractiveCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative h-96 w-full rounded-xl bg-gradient-to-br from-white/10 to-white/0 p-8 border border-white/10 backdrop-blur-sm group"
        >
            <div
                style={{
                    transform: "translateZ(75px)",
                    transformStyle: "preserve-3d",
                }}
                className="absolute inset-0 grid place-content-center rounded-xl shadow-lg"
            >
                {/* Content Container */}
                <div className="flex flex-col h-full justify-between relative z-10 p-6">
                    <div>
                        <div className="text-5xl font-bold text-white/5 font-sans mb-4 absolute top-4 right-4 group-hover:text-blue-500/10 transition-colors duration-500">
                            {number}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 mt-8 group-hover:text-blue-400 transition-colors duration-300">
                            {title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {desc}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-blue-300 italic font-medium">
                            "{quote}"
                        </p>
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
            </div>
        </motion.div>
    );
}
