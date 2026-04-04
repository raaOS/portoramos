import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';

export default function TypingIndicator() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === '') return '.';
                if (prev === '.') return '..';
                if (prev === '..') return '...';
                return '';
            });
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="flex flex-col max-w-[85%] self-start items-start relative"
        >
            <div className="px-4 py-3 rounded-2xl shadow-sm bg-white dark:bg-[#202c33] text-[#667781] dark:text-[#8696a0] rounded-tl-none relative min-w-[140px]">
                {/* Chat Tail SVG */}
                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-[8px] text-white dark:text-[#202c33] fill-current transform scale-x-[-1] overflow-visible z-20">
                    <path d="M5.188 0H0v12.191L8 1.733V0h-2.812z"></path>
                </svg>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#111b21] dark:text-[#e9edef]">Ramos is typing</span>
                    <span className="text-[#00a884] font-bold min-w-[20px]">{dots}</span>
                </div>
            </div>
        </m.div>
    );
}
