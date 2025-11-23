'use client';

import { motion } from 'framer-motion';

interface BlurTextProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
}

export default function BlurText({
    text,
    className = '',
    delay = 0,
    duration = 1,
}: BlurTextProps) {
    const words = text.split(' ');

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.04 * i + delay },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'tween',
                ease: 'easeInOut',
                duration: duration,
            },
        },
        hidden: {
            opacity: 0,
            filter: 'blur(20px)',
            y: 20,
            transition: {
                type: 'tween',
                ease: 'easeInOut',
                duration: duration,
            },
        },
    };

    return (
        <motion.div
            className={`flex flex-wrap justify-center ${className}`}
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    className="inline-block mr-[0.25em] last:mr-0"
                    variants={child}
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}
