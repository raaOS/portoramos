'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Columns, GripVertical } from 'lucide-react';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    labelBefore?: string;
    labelAfter?: string;
}

export default function ComparisonSlider({
    beforeImage,
    afterImage,
    labelBefore = 'Before',
    labelAfter = 'After'
}: ComparisonSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const width = rect.width;
        const position = (x / width) * 100;
        setSliderPosition(Math.min(Math.max(position, 0), 100));
    }, []);

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

    return (
        <div className="w-full relative select-none group">
            <div
                ref={containerRef}
                className="relative w-full aspect-video md:aspect-[16/9] overflow-hidden rounded-2xl cursor-col-resize shadow-2xl"
                onMouseDown={(e) => {
                    setIsResizing(true);
                    handleMove(e.clientX);
                }}
                onTouchStart={(e) => {
                    setIsResizing(true);
                    handleMove(e.touches[0].clientX);
                }}
            >
                {/* After Image (Background) */}
                <img
                    src={afterImage}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                />

                {/* Before Image (Clipped) */}
                <motion.div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src={beforeImage}
                        alt="Before"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        draggable={false}
                    />
                </motion.div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform text-gray-800">
                        <Columns size={14} className="opacity-80" />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
                    {labelBefore}
                </div>
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
                    {labelAfter}
                </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-2">
                <GripVertical size={12} />
                Drag slider to compare
            </p>
        </div>
    );
}
