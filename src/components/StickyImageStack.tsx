'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useSpring, MotionValue, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type MediaItem = {
    id: string;
    type: 'image' | 'video';
    src: string;
    alt?: string;
};

interface StickyImageStackProps {
    items: MediaItem[];
}

function Card({
    item,
    progress,
    range,
    targetScale,
    index,
    total,
    onClick,
    isMobile
}: {
    item: MediaItem;
    progress: MotionValue<number>;
    range: [number, number];
    targetScale: number;
    index: number;
    total: number;
    onClick: (item: MediaItem) => void;
    isMobile: boolean;
}) {
    // Transform vertical scroll progress to horizontal movement (enter from right)

    // Calculate horizontal offset for "fanning out"
    // Center the stack: Shift entire group left by half the total spread

    // Mobile: 0 overlap (single pile). Desktop: 80px overlap (fanned out)
    const overlap = isMobile ? 0 : 80;
    const finalX = (index * overlap) - ((total - 1) * overlap / 2);

    // 1. Initial State:
    // Item 0 is always at its finalX.
    // Items 1..N start far off-screen (100vw).

    // 2. Animation:
    // As progress goes from range[0] to range[1], move from 100vw to finalX.
    // FIX: Anchor the range start at 0 to explicitly force '100vw' (2000px) and opacity 0
    // until the scroll reaches this item's specific start time.
    const startX = 2000;

    const x = useTransform(
        progress,
        [0, range[0], range[1]],
        index === 0
            ? [`${finalX}px`, `${finalX}px`, `${finalX}px`]
            : [`${startX}px`, `${startX}px`, `${finalX}px`]
    );

    // SAFETY: Also animate opacity to ensure items are invisible until they start moving
    // Sync opacity with movement: Fade in as it arrives, Fade out as it leaves
    const opacity = useTransform(
        progress,
        [0, range[0], range[1]],
        index === 0 ? [1, 1, 1] : [0, 0, 1]
    );

    // Add slight rotation for "messy stack" feel on mobile only
    const randomRotate = isMobile ? (index % 2 === 0 ? 2 : -2) : 0;

    return (
        <div
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none"
            style={{
                zIndex: index,
            }}
        >
            <motion.div
                initial={index === 0 ? { x: `${finalX}px` } : { x: `${startX}px` }}
                style={{ x, opacity, rotate: index === 0 ? 0 : randomRotate }}
                onClick={() => onClick(item)}
                className="relative w-[80vw] max-w-[300px] md:max-w-none md:w-[400px] lg:w-[500px] aspect-[4/5] rounded-2xl overflow-hidden origin-center bg-gray-900 border-4 border-white cursor-pointer hover:scale-[1.02] transition-transform duration-300 pointer-events-auto"
            >
                {item.type === 'video' ? (
                    <video
                        key={item.src} // Force re-render on src change
                        src={item.src}
                        autoPlay={true}
                        muted={true}
                        loop={true}
                        playsInline={true}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={item.src}
                        alt={item.alt || ''}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Overlay for index/decoration */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20">
                    {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                </div>
            </motion.div>
        </div>
    );
}

export default function StickyImageStack({ items }: StickyImageStackProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1280); // xl breakpoint (match xl:grid-cols-12 logic in AboutClient)
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Length of scroll interaction.
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    // Add spring physics to make the scroll feel "natural" and "weighted"
    // instead of strictly linear/robotic
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 120, // Tuned for balanced response
        damping: 20,
        restDelta: 0.001
    });

    const [mounted, setMounted] = useState(false);

    // Ensure portal only renders on client
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {/* Height controls how long we scroll. Reduced extra buffer from 100vh to 50vh to minimize negative space */}
            <div ref={containerRef} style={{ height: `${items.length * 90 + 50}vh` }} className="relative bg-[#131314]">
                <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">

                    <div className="relative w-full h-full max-w-[1400px] mx-auto z-10">
                        {items.map((item, i) => {
                            // Calculate range for this card's entry.
                            // We divide the total scroll progress (0 to 1) into chunks.
                            // Buffer at the end (0.9) to ensure completion.

                            const animationEnd = 0.85;
                            const step = animationEnd / items.length;

                            // Overlap Ranges slightly?
                            // No, let's keep them distinct for clean "1 then 2 then 3" feel.

                            const start = i * step;
                            // Clamp end to max 1.0
                            const end = start + step;

                            return (
                                <Card
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    progress={smoothProgress} // Use the smoothed progress
                                    range={[start, end]}
                                    targetScale={1}
                                    total={items.length}
                                    onClick={setSelectedItem}
                                    isMobile={isMobile}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal via Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10"
                            onClick={() => setSelectedItem(null)}
                        >
                            <button
                                className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                                onClick={() => setSelectedItem(null)}
                            >
                                <X className="w-12 h-12" />
                            </button>

                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {selectedItem.type === 'video' ? (
                                    <video
                                        src={selectedItem.src}
                                        autoPlay
                                        controls
                                        className="max-h-[90vh] w-auto bg-black"
                                    />
                                ) : (
                                    <img
                                        src={selectedItem.src}
                                        alt={selectedItem.alt || ''}
                                        className="max-h-[85vh] w-auto object-contain"
                                    />
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
