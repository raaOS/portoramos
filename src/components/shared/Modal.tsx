'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useCallback } from 'react';

export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Wait for animation to finish then navigate back
    setTimeout(() => {
      router.back();
    }, 250);
  }, [router]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop - semi-transparent with blur to show grid behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 cursor-pointer bg-black/70 print:hidden"
          />

          {/* Modal Content - Pinterest style large centered box */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-[101] max-h-[90vh] w-[95vw] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 md:w-[85vw] lg:w-[75vw] xl:w-[65vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - top right corner, floating */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-50 rounded-full border border-gray-200/50 bg-white p-2.5 text-gray-700 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl dark:border-gray-700/50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 print:hidden"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Scrollable Content Area */}
            <div className="max-h-[90vh] overflow-y-auto overflow-x-hidden">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
