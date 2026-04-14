'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SmoothScroll() {
    const pathname = usePathname();
    const isOsMode = pathname?.startsWith('/about-test');
    const isProjectsRoute = pathname?.startsWith('/projects');

    useEffect(() => {
        if (isOsMode || isProjectsRoute) return;

        let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
        let rafId: number;

        // Lazy-load Lenis to reduce initial bundle size (~12KB savings)
        import('lenis').then((LenisModule) => {
            const Lenis = LenisModule.default;

            lenis = new Lenis({
                duration: 1.5, // Slightly "heavier" for premium feel
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 0.9, // Lower multiplier for more controlled scrolling
                touchMultiplier: 2,
            });

            function raf(time: number) {
                lenis?.raf(time);
                rafId = requestAnimationFrame(raf);
            }

            rafId = requestAnimationFrame(raf);
        });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            lenis?.destroy();
        };
    }, [isOsMode, isProjectsRoute]);

    return null;
}
