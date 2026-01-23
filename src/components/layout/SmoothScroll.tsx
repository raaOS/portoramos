'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScroll() {
    const pathname = usePathname();
    const isOsMode = pathname?.startsWith('/about-test');

    useEffect(() => {
        if (isOsMode) return;

        const lenis = new Lenis({
            duration: 1.5, // Slightly "heavier" for premium feel
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.9, // Lower multiplier for more controlled scrolling
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [isOsMode]);

    return null;
}
