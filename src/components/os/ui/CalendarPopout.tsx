"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Z_LAYERS } from '../utils/zIndexLayers';

interface CalendarPopoutProps {
    isOpen: boolean;
    onClose?: () => void;
}

export default function CalendarPopout({ isOpen, onClose: _onClose }: CalendarPopoutProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!isOpen) return null;

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
    const startDay = firstDayOfMonth(year, month);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const isToday = (day: number) => {
        return day === currentDate.getDate() && 
               month === currentDate.getMonth() && 
               year === currentDate.getFullYear();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ zIndex: Z_LAYERS.POPOUT_CONTENT }}
            className="fixed top-11 right-4 w-[280px] bg-white/80 dark:bg-black/70 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl p-4 text-black dark:text-white overflow-hidden"
        >
            {/* Header: Clock & Date */}
            <div className="mb-6 text-center">
                <div className="text-3xl font-light tracking-tight mb-1">
                    {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">
                    {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm font-bold">{monthName} {year}</span>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                    <div key={`${d}-${i}`} className="text-[10px] font-bold opacity-40 h-6 flex items-center justify-center">{d}</div>
                ))}
                {Array(startDay).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                ))}
                {days.map(day => (
                    <div 
                        key={day} 
                        className={`h-8 flex items-center justify-center text-xs rounded-full transition-all relative group cursor-default
                            ${isToday(day) ? 'bg-zinc-900 dark:bg-white text-white dark:text-black font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}
                        `}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Bottom Accent */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 text-[10px] text-center opacity-50 italic">
                Ramos OS • Desktop Environment
            </div>
        </motion.div>
    );
}
