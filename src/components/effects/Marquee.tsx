'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface MarqueeProps {
    items: string[];
    direction?: 'left' | 'right';
    speed?: number;
    className?: string;
}

export default function Marquee({
    items,
    direction = 'left',
    speed = 20,
    className = ''
}: MarqueeProps) {
    // State to trigger animation ONLY after mount (fixes hydration issue on refresh)
    const [runAnimation, setRunAnimation] = useState(false);

    useEffect(() => {
        // Small delay to ensure hydration is complete
        const timer = setTimeout(() => {
            setRunAnimation(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Triple the items to ensure smooth infinite loop without gaps
    const marqueeItems = [...items, ...items, ...items];

    // Initial position (visible, at starting point)
    const initialX = direction === 'left' ? '0%' : '-33.33%';

    return (
        <div className={`relative flex overflow-hidden w-full ${className}`}>
            <motion.div
                className="flex whitespace-nowrap py-4"
                initial={{ x: initialX }}
                animate={runAnimation ? {
                    x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%']
                } : { x: initialX }}
                transition={runAnimation ? {
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed,
                } : { duration: 0 }}
            >
                {marqueeItems.map((item, index) => (
                    <div key={index} className="mx-2 md:mx-4">
                        <span className="text-xl md:text-2xl font-bold font-sans uppercase tracking-widest text-white">
                            {item}
                        </span>
                        <span className="ml-4 md:ml-8 mr-2 text-gray-400 text-lg md:text-xl">•</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
