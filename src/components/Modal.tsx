'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Modal({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    // Close modal on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        // Prevent body scroll and handle layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        // Only add padding if there is a scrollbar to avoid shifting on mobile/overlay
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Wait for animation to finish then navigate back
        setTimeout(() => {
            router.back();
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.3 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 cursor-pointer"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-5xl max-h-[90vh] bg-white sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-[101] m-4"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
