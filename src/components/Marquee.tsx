'use client';

import { motion } from 'framer-motion';

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
    // Triple the items to ensure smooth infinite loop without gaps
    const marqueeItems = [...items, ...items, ...items];

    return (
        <div className={`relative flex overflow-hidden w-full ${className}`}>
            <motion.div
                className="flex whitespace-nowrap py-4"
                animate={{
                    x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%']
                }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed,
                }}
            >
                {marqueeItems.map((item, index) => (
                    <div key={index} className="mx-2 md:mx-4">
                        <span className="text-3xl md:text-5xl font-bold font-display uppercase tracking-widest text-black/90">
                            {item}
                        </span>
                        <span className="ml-4 md:ml-8 mr-2 text-gray-300 text-2xl md:text-4xl">•</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
