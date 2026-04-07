'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DigitalClockWidget() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Prevent hydration mismatch by returning null or a skeleton until the first effect runs
    if (!time) {
        return (
            <div className="absolute top-10 right-10 flex flex-col items-end pointer-events-none opacity-0">
                <div className="text-5xl font-extralight tracking-tight text-white drop-shadow-md">00:00</div>
                <div className="text-sm font-medium text-white/80 drop-shadow-sm uppercase tracking-widest mt-1">
                    Loading
                </div>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 right-12 z-0 pointer-events-none flex flex-col items-end select-none"
        >
            <div className="text-6xl sm:text-7xl font-extralight tracking-tighter text-white drop-shadow-lg leading-none">
                {formatTime(time)}
            </div>
            <div className="text-sm sm:text-base font-medium text-white/90 drop-shadow-md tracking-wide mt-2">
                {formatDate(time)}
            </div>
        </motion.div>
    );
}
