'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Columns, GripVertical } from 'lucide-react';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeType?: 'image' | 'video';
    afterType?: 'image' | 'video';
    labelBefore?: string;
    labelAfter?: string;
    aspectRatio?: number;
}

export default function ComparisonSlider({
    beforeImage,
    afterImage,
    beforeType = 'image',
    afterType = 'image',
    labelBefore = 'Before',
    labelAfter = 'After',
    aspectRatio
}: ComparisonSliderProps) {
    const x = useMotionValue(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Create a spring-physics version of x for smooth "follow" feel
    const smoothX = useSpring(x, { damping: 50, stiffness: 400 });

    const clipPath = useTransform(smoothX, (v: number) => `inset(0 ${100 - v}% 0 0)`);
    const leftPos = useTransform(smoothX, (v: number) => `${v}%`);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xPos = clientX - rect.left;
        const width = rect.width;
        const position = (xPos / width) * 100;
        x.set(Math.min(Math.max(position, 0), 100));
    }, [x]);

    const handleMouseDown = () => setIsResizing(true);
    const handleMouseUp = () => setIsResizing(false);
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        handleMove(e.clientX);
    }, [isResizing, handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isResizing) return;
        handleMove(e.touches[0].clientX);
    }, [isResizing, handleMove]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleTouchMove]);

    // Helper to render media
    const renderMedia = (src: string, type: 'image' | 'video', alt: string, className: string) => {
        if (type === 'video') {
            return (
                <video
                    src={src}
                    className={className}
                    autoPlay
                    muted
                    loop
                    playsInline
                    draggable={false}
                />
            );
        }
        return (
            <img
                src={src}
                alt={alt}
                className={className}
                draggable={false}
            />
        );
    };

    return (
        <div className="w-full relative select-none group">
            <div
                ref={containerRef}
                className="relative w-full rounded-xl cursor-col-resize overflow-hidden bg-gray-100 dark:bg-gray-900"
                style={{ aspectRatio: aspectRatio || 16 / 9 }}
                onMouseDown={(e) => {
                    setIsResizing(true);
                    handleMove(e.clientX);
                }}
                onTouchStart={(e) => {
                    setIsResizing(true);
                    handleMove(e.touches[0].clientX);
                }}
            >
                {/* After Media (Bottom Layer) */}
                <div className="absolute inset-0 w-full h-full">
                    {renderMedia(afterImage, afterType || 'image', "After", "w-full h-full object-cover")}
                </div>

                {/* Before Media (Top Layer - Clipped) */}
                <motion.div
                    className="absolute inset-0 w-full h-full overflow-hidden will-change-[clip-path]"
                    style={{ clipPath }}
                >
                    <div className="absolute inset-0 w-full h-full">
                        {renderMedia(beforeImage, beforeType || 'image', "Before", "w-full h-full object-cover")}
                    </div>
                </motion.div>

                {/* Slider Handle */}
                <motion.div
                    className="absolute top-0 bottom-0 w-0.5 md:w-1 bg-white cursor-col-resize z-20 flex items-center justify-center pointer-events-none"
                    style={{ left: leftPos }}
                >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-gray-800 border-2 border-gray-100">
                        <Columns size={16} className="opacity-80" />
                    </div>
                </motion.div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                    {labelBefore}
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                    {labelAfter}
                </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-2 animate-pulse">
                <GripVertical size={12} />
                Drag to compare
            </p>
        </div>
    );
}
