import { useState, useEffect } from 'react';

export const useDesktopLock = () => {
    const [mounted, setMounted] = useState(false);
    const [windowSize, setWindowSize] = useState(() => {
        if (typeof window !== 'undefined') {
            return { width: window.innerWidth, height: window.innerHeight };
        }
        return { width: 0, height: 0 };
    });
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') return window.innerWidth < 768;
        return false;
    });

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));

        const html = document.documentElement;
        const body = document.body;
        const originalStyles = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow,
            htmlHeight: html.style.height,
            bodyHeight: body.style.height
        };

        // Lock
        window.scrollTo(0, 0);
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.height = "100%";
        body.style.height = "100%";
        html.classList.add('lenis-stopped');

        // Style Injection (Safe)
        const styleId = 'os-mode-reset';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                html, body {
                    overflow: hidden !important;
                    height: 100vh !important;
                    width: 100vw !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    overscroll-behavior: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        const handleResize = () => {
            const width = window.innerWidth;
            setWindowSize({ width, height: window.innerHeight });
            setIsMobile(width < 768);
        };

        // Initial mobile check
        requestAnimationFrame(() => setIsMobile(window.innerWidth < 768));

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);

            // Restore
            html.style.overflow = originalStyles.htmlOverflow;
            body.style.overflow = originalStyles.bodyOverflow;
            html.style.height = originalStyles.htmlHeight;
            body.style.height = originalStyles.bodyHeight;
            html.classList.remove('lenis-stopped');

            const styleTag = document.getElementById(styleId);
            if (styleTag) styleTag.remove();
        };
    }, []);

    return { mounted, windowSize, isMobile };
};
