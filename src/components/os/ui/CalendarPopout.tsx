'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Z_LAYERS } from '../utils/zIndexLayers';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarPopoutProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function CalendarPopout({
  isOpen: _isOpen,
  onClose: _onClose,
}: CalendarPopoutProps) {
  const { dictionary: t, meta } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleString(meta.intlLocale, { month: 'long' });
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isToday = (day: number) => {
    return (
      day === currentDate.getDate() &&
      month === currentDate.getMonth() &&
      year === currentDate.getFullYear()
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, width: 46, height: 46, filter: 'blur(4px)' }}
      animate={{ opacity: 1, width: 280, height: 'auto', filter: 'blur(0px)' }}
      exit={{ opacity: 0, width: 46, height: 46, filter: 'blur(4px)' }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 34,
        mass: 0.85,
        opacity: { duration: 0.16 },
        filter: { duration: 0.16 },
        width: { type: 'spring', stiffness: 430, damping: 34, mass: 0.85 },
        height: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
      }}
      style={{ zIndex: Z_LAYERS.POPOUT_CONTENT }}
      className="fixed right-4 top-11 flex flex-col items-end overflow-hidden rounded-2xl border border-white/20 bg-white/80 text-black shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-black/70 dark:text-white"
    >
      <motion.div 
        className="w-[280px] shrink-0 p-4"
        initial={{ opacity: 0, x: 8, filter: 'blur(2px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: 8, filter: 'blur(2px)' }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header: Clock & Date */}
        <div className="mb-6 text-center">
          <div className="mb-1 text-3xl font-light tracking-tight">
            {currentDate.toLocaleTimeString(meta.intlLocale, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {currentDate.toLocaleDateString(meta.intlLocale, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-sm font-bold">
            {monthName} {year}
          </span>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {t.calendar.weekdaysShort.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="flex h-6 items-center justify-center text-[10px] font-bold opacity-40"
            >
              {d}
            </div>
          ))}
          {Array(startDay)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
          {days.map((day) => (
            <div
              key={day}
              className={`group relative flex h-8 cursor-default items-center justify-center rounded-full text-xs transition-all ${isToday(day) ? 'bg-zinc-900 font-bold text-white dark:bg-white dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/5'} `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Bottom Accent */}
        <div className="mt-4 border-t border-black/5 pt-4 text-center text-[10px] italic opacity-50 dark:border-white/5">
          {t.calendar.footer}
        </div>
      </motion.div>
    </motion.div>
  );
}
