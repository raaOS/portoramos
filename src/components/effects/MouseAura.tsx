'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function MouseAura() {
    const [isMobile, setIsMobile] = useState(true); // Default to true to prevent flash on server
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth physics-based springing
    const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        // Only run on client and check for mouse capability
        const checkDevice = () => {
            const hasMouse = window.matchMedia('(pointer: fine)').matches;
            setIsMobile(!hasMouse);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

    if (isMobile) return null;

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
            aria-hidden="true"
        >
            <motion.div
                style={{
                    x: springX,
                    y: springY,
                }}
                className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-[120px] mix-blend-screen pointer-events-none"
            />
        </motion.div>
    );
}
