'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyVideoProps {
    src: string;
    poster?: string;
    className?: string;
    muted?: boolean;
    loop?: boolean;
    playsInline?: boolean;
    autoPlay?: boolean;
}

export default function LazyVideo({
    src,
    poster,
    className,
    muted = true,
    loop = true,
    playsInline = true,
    autoPlay = true
}: LazyVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInView, setIsInView] = useState(false);

    // Proxy the video source if it's from GitHub
    const proxiedSrc = src && (src.includes('raw.githubusercontent.com') || src.startsWith('/assets/'))
        ? `/api/media?url=${encodeURIComponent(src)}`
        : src;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (autoPlay) {
                        video.play().catch(() => {
                            // Autoplay might be blocked by browser policy
                            console.log('[LazyVideo] Autoplay prevented');
                        });
                    }
                } else {
                    video.pause();
                }
            },
            {
                threshold: 0.1, // Start loading when even 10% is visible
                rootMargin: '100px', // Pre-load 100px before entering viewport
            }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
        };
    }, [autoPlay]);

    return (
        <video
            ref={videoRef}
            className={className}
            poster={poster}
            muted={muted}
            loop={loop}
            playsInline={playsInline}
            preload="none" // Don't load anything until in view
        >
            {isInView && <source src={proxiedSrc} type="video/mp4" />}
        </video>
    );
}
