import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ChevronLeft, 
    ChevronRight,
    Play,
    Pause,
    X
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
    const mediaKey = useMemo(() => `${type}:${url}`, [type, url]);

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <QuickLookModalBody
                key={mediaKey}
                onClose={onClose}
                title={title}
                type={type}
                url={url}
                metadata={metadata}
                onGoToDetail={onGoToDetail}
                hasNext={hasNext}
                hasPrev={hasPrev}
                onNext={onNext}
                onPrev={onPrev}
            />
        </AnimatePresence>
    );
}

function QuickLookModalBody({
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
}: Omit<QuickLookModalProps, 'isOpen'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const rotation = 0;
    const isFullscreen = true;
    const videoRef = useRef<HTMLVideoElement>(null);

    const [showStatus, setShowStatus] = useState<'play' | 'pause' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        if (type === 'video') return;
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.75, scale + delta), 4);
        setScale(newScale);
    };

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setShowStatus('play');
            } else {
                videoRef.current.pause();
                setShowStatus('pause');
            }
            setTimeout(() => setShowStatus(null), 800);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.code === 'Space') {
                e.preventDefault();
                if (type === 'video') togglePlay();
                else onClose();
            }
            if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
            if (e.key === '=' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); }
            if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); }
        };

        const timer = setTimeout(() => {
            document.addEventListener('keydown', handleKeyDown);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, type, hasNext, hasPrev, onNext, onPrev]);

    return (
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
                    <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-50 pointer-events-auto">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">{title}</span>
                                {metadata && <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{metadata}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onGoToDetail && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onGoToDetail(); }}
                                    className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide border border-white/10 transition-all active:scale-95"
                                >
                                    Open
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div 
                        ref={containerRef}
                        className="flex-1 overflow-hidden relative flex items-center justify-center p-0"
                        onWheel={handleWheel}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}

                        {/* Play/Pause Center Feedback */}
                        <AnimatePresence>
                            {showStatus && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.5 }}
                                    className="absolute inset-0 flex items-center justify-center z-[70] pointer-events-none"
                                >
                                    <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10">
                                        {showStatus === 'play' ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        {hasPrev && onPrev && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                className="absolute left-4 z-[60] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all group/nav border border-white/5"
                            >
                                <ChevronLeft size={24} className="group-hover/nav:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        {hasNext && onNext && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
                                className="absolute right-4 z-[60] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all group/nav border border-white/5"
                            >
                                <ChevronRight size={24} className="group-hover/nav:translate-x-0.5 transition-transform" />
                            </button>
                        )}

                        {/* Main Media */}
                        <motion.div 
                            className="w-full h-full flex items-center justify-center relative z-10"
                            animate={{ scale, rotate: rotation }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            drag={scale > 1}
                            dragConstraints={containerRef}
                            dragElastic={0.1}
                        >
                            {(type === 'image' || type === 'project') && (
                                <img 
                                    src={url} 
                                    alt={title} 
                                    className={`max-w-full max-h-full object-contain transition-all duration-300 ${scale > 1 ? 'cursor-grab active:cursor-grabbing scale-100' : 'cursor-zoom-in'}`}
                                    onLoad={() => setIsLoading(false)}
                                    draggable={false}
                                />
                            )}

                            {type === 'video' && (
                                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                                    <video 
                                        ref={videoRef}
                                        src={url} 
                                        controls={false}
                                        autoPlay 
                                        loop
                                        className="max-w-full max-h-full"
                                        onLoadedData={() => setIsLoading(false)}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Minimal Gallery Tip */}
                    {(hasNext || hasPrev) && (
                        <div className="absolute bottom-8 inset-x-0 flex justify-center z-50 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] border border-white/5">
                                Swipe or Arrows to Navigate
                            </div>
                        </div>
                    )}
            </motion.div>
        </div>
    );
}
