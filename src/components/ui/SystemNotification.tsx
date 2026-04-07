'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, AlertCircle, XCircle } from 'lucide-react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface SystemNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: string;
    type?: NotificationType;
    duration?: number;
}

export default function SystemNotification({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    type = 'success',
    duration = 3000
}: SystemNotificationProps) {

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [isOpen, duration, onClose]);

    const icons = {
        success: <CheckCircle2 className="text-green-500" size={24} />,
        info: <Info className="text-blue-500" size={24} />,
        warning: <AlertCircle className="text-yellow-500" size={24} />,
        error: <XCircle className="text-red-500" size={24} />
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed top-6 right-6 z-[999999] pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="pointer-events-auto w-80 bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex"
                    >
                        {/* OS Style Notification */}
                        <div className="flex w-full items-start p-4 gap-3">
                            <div className="shrink-0 drop-shadow-sm mt-0.5">
                                {icons[type]}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                                    {title}
                                </h4>
                                {message && (
                                    <p className="text-[13px] mt-1 text-gray-600 dark:text-gray-400 font-medium leading-snug">
                                        {message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
