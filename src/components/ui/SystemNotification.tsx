'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  duration = 3000,
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
    error: <XCircle className="text-red-500" size={24} />,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pointer-events-none fixed right-6 top-6 z-[999999]">
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex w-80 overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1a1e]/80"
          >
            {/* OS Style Notification */}
            <div className="flex w-full items-start gap-3 p-4">
              <div className="mt-0.5 shrink-0 drop-shadow-sm">{icons[type]}</div>
              <div className="flex-1">
                <h4 className="text-[15px] font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
                  {title}
                </h4>
                {message && (
                  <p className="mt-1 text-[13px] font-medium leading-snug text-gray-600 dark:text-gray-400">
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
