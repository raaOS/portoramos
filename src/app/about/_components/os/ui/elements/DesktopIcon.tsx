import React, { useState, useEffect, useRef } from "react";
import { m, useMotionValue } from "framer-motion";
import Image from "next/image";
import { soundManager } from "../../utils/SoundManager";

interface DesktopIconProps {
    id: string;
    label: string;
    icon?: React.ReactNode;
    imageUrl?: string;
    videoUrl?: string;
    onClick: () => void;
    x?: number;
    y?: number;
    size?: "small" | "medium" | "large";
    aspectRatio?: number;
    children?: React.ReactNode;
    priority?: boolean;
    isMobile?: boolean;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onHoverStart?: (id: string) => void;
    onHoverEnd?: (id: string) => void;

}

export default function DesktopIcon({ id, label, icon, imageUrl, videoUrl, onClick, x = 0, y = 0, size = "medium", aspectRatio = 1, children, priority = false, isMobile = false, onPositionChange, onHoverStart, onHoverEnd }: DesktopIconProps) {
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
    const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);
    const [hovering, setHovering] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageError = Boolean(imageUrl && failedImageUrl === imageUrl);
    const videoError = Boolean(videoUrl && failedVideoUrl === videoUrl);

    // Handle video playback on hover
    useEffect(() => {
        if (videoRef.current) {
            if (hovering && !isMobile) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
                // videoRef.current.currentTime = 0; // Optional: reset to start
            }
        }
    }, [hovering, isMobile]);

    // Motion Values for smooth coordinate handling (avoids jump on drag end)
    const iconX = useMotionValue(x);
    const iconY = useMotionValue(y);

    const [isDragging, setIsDragging] = useState(false);

    // Sync MotionValues with props when parent updates them (e.g. initial load or reset)
    useEffect(() => {
        if (isDragging) return; // Don't snap back mid-drag
        iconX.set(x);
        iconY.set(y);
    }, [x, y, iconX, iconY, isDragging]);

    const baseHeight = {
        small: isMobile ? 58 : 64, // ~10% smaller
        medium: isMobile ? 72 : 80, // ~10% smaller
        large: isMobile ? 86 : 96  // ~10% smaller
    }[size];

    const handleDragStart = () => {
        setIsDragging(true);
        soundManager.play('drag');
    };

    const handleDragEnd = () => {
        setTimeout(() => setIsDragging(false), 50); // Small delay to prevent click firing immediately after drag

        if (onPositionChange) {
            // Because we are using useMotionValue mapped to x/y style, 
            // the .get() value IS the absolute position relative to the nearest relative parent (Desktop container)
            // provided that left/top are 0 (which they are in our style prop below)
            const newX = iconX.get();
            const newY = iconY.get();

            onPositionChange(id, newX, newY);
        }
    };

    const showMedia = (imageUrl && !imageError) || (videoUrl && !videoError);

    return (
        <m.div
            drag
            dragMomentum={false}
            dragElastic={0.05}
            onDragStart={handleDragStart}
            onDragEnd={(_e, _info) => {
                handleDragEnd();
            }}
            data-lenis-prevent
            onClick={(_e) => {
                if (!isDragging) {
                    soundManager.play('click');
                    onClick();
                }
            }}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x: iconX,
                y: iconY
            }}
            // Layout synchronization disabled to prevent global layout shifts
            layout={false} // Disable to prevent layout sync bugs with Dock icons

            className={`flex flex-col items-center gap-1 w-auto group cursor-pointer pointer-events-auto will-change-transform focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none rounded-none`}
            role="button"
            aria-label={label}
            tabIndex={0}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
                    e.preventDefault();
                    soundManager.play('click');
                    onClick();
                }
            }}
            whileHover={!isMobile ? { 
                scale: 1.1, 
                transition: { type: "spring", stiffness: 400, damping: 25 } 
            } : undefined}
            whileTap={!isMobile ? { 
                scale: 0.9, // More tactile tap
                transition: { type: "spring", stiffness: 600, damping: 30 }
            } : undefined}
            onMouseEnter={() => { if (!isMobile) setHovering(true); if (onHoverStart) onHoverStart(id); }}
            onMouseLeave={() => { if (!isMobile) setHovering(false); if (onHoverEnd) onHoverEnd(id); }}
        >
            {children ? (
                <div className="relative">
                    {children}
                </div>
            ) : showMedia ? (
                <div
                    style={{
                        height: baseHeight,
                        width: baseHeight * aspectRatio,
                        minWidth: baseHeight * aspectRatio,
                        minHeight: baseHeight,
                    }}
                    className={`relative border-2 border-white/40 group-hover:border-white/60 transition-colors bg-white/20 overflow-hidden rounded-none`}
                >
                    {/* Always render Image as base layer if available and not error */}
                    {imageUrl && !imageError && (
                        <Image
                            src={imageUrl}
                            alt={label}
                            fill
                            className={`object-cover pointer-events-none transition-opacity duration-300 ${hovering && videoUrl && !videoError ? 'opacity-0' : 'opacity-100'}`}
                            sizes="(max-width: 768px) 96px, 128px"
                            draggable={false}
                            onError={() => setFailedImageUrl(imageUrl ?? "__missing__")}
                            priority={priority} // Important for LCP
                            loading={priority ? "eager" : "lazy"}
                            quality={60} // Thumbnails don't need 100% quality
                        />
                    )}

                    {/* Always render Video if video exists to act as its own thumbnail fallback */}
                    {videoUrl && !isMobile && !videoError && (
                        <video
                            ref={videoRef}
                            src={videoUrl + '#t=0.1'}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className={`absolute inset-0 object-cover w-full h-full pointer-events-none rounded-none transition-opacity duration-300 ${(!hovering && imageUrl && !imageError) ? 'opacity-0' : 'opacity-100'}`}
                            draggable={false}
                            onError={() => setFailedVideoUrl(videoUrl ?? "__missing__")}
                        />
                    )}

                    {/* Show simple loading/placeholder if everything fails */}
                    {imageError && (!videoUrl || videoError) && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                             <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">No Media</div>
                         </div>
                    )}
                </div>
            ) : (
                <div className={`w-16 h-16 bg-white/20 rounded-none border border-white/30 flex items-center justify-center transition-colors group-hover:bg-white/30`}>
                    <div className="text-black/80 group-hover:text-black transition-colors">
                        {icon}
                    </div>
                </div>
            )}

        </m.div>
    );
}
