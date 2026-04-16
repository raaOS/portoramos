import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ExternalLink, 
    ZoomIn, 
    ZoomOut, 
    RotateCw, 
    Maximize, 
    ChevronLeft, 
    ChevronRight,
    Play,
    Pause
} from 'lucide-react';

interface QuickLookModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'image' | 'video' | 'pdf' | 'text' | 'project';
    url: string;
    metadata?: string;
    onGoToDetail?: () => void;
    // New Props for Gallery
    hasNext?: boolean;
    hasPrev?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
}

export default function QuickLookModal({ 
    isOpen, 
    onClose, 
    title, 
    type, 
    url, 
    metadata, 
    onGoToDetail,
    hasNext,
    hasPrev,
    onNext,
    onPrev
}: QuickLookModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    // Reset state when url changes
    useEffect(() => {
        setIsLoading(true);
        setScale(1);
        setRotation(0);
        setIsPlaying(true);
    }, [url]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.code === 'Space') {
                e.preventDefault();
                if (type === 'video') togglePlay();
                else onClose();
            }
            if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
            if (e.key === '=' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleZoomIn(); }
            if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleZoomOut(); }
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleRotate(); }
        };

        const timer = setTimeout(() => {
            document.addEventListener('keydown', handleKeyDown);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, type, hasNext, hasPrev, onNext, onPrev]);

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 ${isFullscreen ? 'sm:p-0' : ''}`}>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative w-full ${isFullscreen ? 'h-full max-w-full' : 'max-w-5xl max-h-[90vh]'} bg-black rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-white/5`}
                >
                    {/* Toolbar Overhead */}
                    <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-50 pointer-events-auto group">
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white truncate max-w-[200px]">{title}</span>
                                {metadata && <span className="text-[10px] text-white/50">{metadata}</span>}
                            </div>
                        </div>

                        {/* Middle Controls */}
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {type === 'image' && (
                                <>
                                    <button onClick={handleZoomOut} className="p-1 hover:bg-white/10 rounded-full text-white/80"><ZoomOut size={16} /></button>
                                    <span className="text-[10px] font-mono text-white/60 min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
                                    <button onClick={handleZoomIn} className="p-1 hover:bg-white/10 rounded-full text-white/80"><ZoomIn size={16} /></button>
                                    <div className="w-px h-3 bg-white/20 mx-1" />
                                    <button onClick={handleRotate} className="p-1 hover:bg-white/10 rounded-full text-white/80"><RotateCw size={16} /></button>
                                </>
                            )}
                            {type === 'video' && (
                                <button onClick={togglePlay} className="p-1 hover:bg-white/10 rounded-full text-white/80">
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                            )}
                            <div className="w-px h-3 bg-white/20 mx-1" />
                            <button onClick={toggleFullscreen} className="p-1 hover:bg-white/10 rounded-full text-white/80">
                                <Maximize size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                             {onGoToDetail && (
                                <button onClick={onGoToDetail} className="px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold hover:bg-gray-200 transition-colors">
                                    Open Details
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative flex items-center justify-center p-0">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        {hasPrev && onPrev && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                className="absolute left-4 z-[60] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all group/nav"
                            >
                                <ChevronLeft size={24} className="group-hover/nav:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        {hasNext && onNext && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
                                className="absolute right-4 z-[60] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all group/nav"
                            >
                                <ChevronRight size={24} className="group-hover/nav:translate-x-0.5 transition-transform" />
                            </button>
                        )}

                        {/* Main Media */}
                        <motion.div 
                            className="w-full h-full flex items-center justify-center"
                            animate={{ scale, rotate: rotation }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {(type === 'image' || type === 'project') && (
                                <img 
                                    src={url} 
                                    alt={title} 
                                    className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                                    onLoad={() => setIsLoading(false)}
                                    draggable={false}
                                />
                            )}

                            {type === 'video' && (
                                <video 
                                    ref={videoRef}
                                    src={url} 
                                    controls={false}
                                    autoPlay 
                                    loop
                                    className="max-w-full max-h-full"
                                    onLoadedData={() => setIsLoading(false)}
                                    onClick={togglePlay}
                                />
                            )}
                        </motion.div>
                    </div>

                    {/* Progress indicator for Gallery */}
                    {(hasNext || hasPrev) && (
                        <div className="absolute bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
                            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/50 font-medium">
                                Navigation enabled (Arrows)
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
