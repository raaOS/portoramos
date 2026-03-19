'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryItem } from '@/types/projects';
import Media from '@/components/shared/Media';
import { getProxiedUrl } from "@/lib/utils";

interface LightboxGalleryProps {
    items: GalleryItem[];
    initialIndex?: number;
    onClose: () => void;
    groupName?: string;
}

export default function LightboxGallery({ items, initialIndex = 0, onClose, groupName }: LightboxGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const validItems = items.filter(item => item.isActive !== false);

    // Navigation handlers
    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === validItems.length - 1 ? 0 : prev + 1));
    }, [validItems.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? validItems.length - 1 : prev - 1));
    }, [validItems.length]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
    }, [onClose, handleNext, handlePrev]);

    useEffect(() => {
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    if (validItems.length === 0) return null;

    const currentItem = validItems[currentIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            >
                {/* Header / Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="text-white/80 font-medium text-sm drop-shadow-md">
                        {groupName && <span className="mr-2 opacity-70">{groupName} &bull;</span>}
                        {currentIndex + 1} / {validItems.length}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-20 gap-8">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative flex-grow w-full flex items-center justify-center min-h-0"
                    >
                        {currentItem.kind === 'video' ? (
                            <Media
                                kind="video"
                                src={currentItem.src}
                                poster={currentItem.poster}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                autoplay={true}
                                muted={false}
                                loop={true}
                                playsInline={true}
                                controls={true}
                            />
                        ) : (
                            <img
                                src={getProxiedUrl(currentItem.src)}
                                alt={currentItem.alt || `Gallery Image ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm select-none"
                                draggable={false}
                            />
                        )}
                    </motion.div>

                    {/* Thumbnails Ribbon */}
                    {validItems.length > 1 && (
                        <div className="w-full flex justify-center pb-4 sm:pb-0">
                            <div className="flex items-center justify-start gap-3 p-2 pointer-events-auto max-w-full overflow-x-auto no-scrollbar scroll-smooth">
                                {validItems.map((item, index) => (
                                    <button
                                        key={`thumb-${index}`}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                                        className={`relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 overflow-hidden border-2 transition-all duration-300 ${
                                            index === currentIndex 
                                                ? 'border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10' 
                                                : 'border-white/10 opacity-40 hover:opacity-100 hover:scale-105'
                                        }`}
                                    >
                                        {item.kind === 'video' ? (
                                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                                {item.poster ? (
                                                    <img src={getProxiedUrl(item.poster)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/50">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={getProxiedUrl(item.src)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                {validItems.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 rounded-full transition-all backdrop-blur-md z-10 hidden sm:block group"
                        >
                            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 rounded-full transition-all backdrop-blur-md z-10 hidden sm:block group"
                        >
                            <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Mobile invisible touch zones for navigation */}
                        <div className="absolute inset-y-0 left-0 w-1/3 z-0 sm:hidden" onClick={handlePrev} />
                        <div className="absolute inset-y-0 right-0 w-1/3 z-0 sm:hidden" onClick={handleNext} />
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
