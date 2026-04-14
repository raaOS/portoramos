import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';


interface QuickLookModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'image' | 'video' | 'pdf' | 'text' | 'project';
    url: string;
    metadata?: string;
    onGoToDetail?: () => void;
}

export default function QuickLookModal({ isOpen, onClose, title, type, url, metadata, onGoToDetail }: QuickLookModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    // Trap Escape key and Space key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        // Delay attaching to prevent immediate close if opened via space
        const timer = setTimeout(() => {
            document.addEventListener('keydown', handleKeyDown);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-4xl max-h-full bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-black/10 dark:border-white/10"
                    >
                        {/* Title Bar */}
                        <div className="h-12 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-4 select-none shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Traffic Lights matched to OS Windows */}
                                <div className="flex gap-[8px] group items-center">
                                    {/* Close Button (Red) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                                        aria-label="Close window"
                                    >
                                        <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                                            <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                                        </div>
                                    </button>

                                    {/* Minimize mock */}
                                    <div className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative pointer-events-none">
                                        <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DDA335] flex items-center justify-center relative transition-all" />
                                    </div>

                                    {/* Maximize mock */}
                                    <div className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative pointer-events-none">
                                        <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#22AA32] flex items-center justify-center relative transition-all" />
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {onGoToDetail && (
                                    <button 
                                        onClick={onGoToDetail}
                                        className="px-3 py-1 flex items-center gap-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        <ExternalLink size={14} /> Open
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto min-h-[300px] flex flex-col relative bg-gray-50 dark:bg-black/50 items-center justify-center p-4">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
                                </div>
                            )}

                            {(type === 'image' || type === 'project') && (
                                <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
                                    <img 
                                        src={url} 
                                        alt={title} 
                                        className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                        onLoad={() => setIsLoading(false)}
                                    />
                                </div>
                            )}

                            {type === 'video' && (
                                <video 
                                    src={url} 
                                    controls 
                                    autoPlay 
                                    className="max-w-full max-h-[70vh] object-contain"
                                    onLoadedData={() => setIsLoading(false)}
                                />
                            )}
                            
                            {/* Subtext info */}
                            {metadata && (
                                <div className="w-full text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
                                    {metadata}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
