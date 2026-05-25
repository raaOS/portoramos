'use client';

import React, { useState, useEffect } from 'react';
import { Search, Wifi, LogOut } from 'lucide-react';
import { useOSSystem } from '../context/OSSystemContext';
import { Z_LAYERS } from '../utils/zIndexLayers';

interface MenuBarProps {
  onSearch?: () => void;
  activeWindow?: string;
  onAbout?: () => void;
  availability?: {
    status: string;
    text: string;
  };
  isAdmin?: boolean;
  onLogout?: () => void;
  onToggleControlCenter?: () => void;
}

export default function MenuBar({
  onSearch,
  activeWindow = 'Finder',
  onAbout,
  availability,
  isAdmin,
  onLogout,
  onToggleControlCenter,
}: MenuBarProps) {
  const { showCalendar, setShowCalendar } = useOSSystem();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const updateClock = () => setTime(new Date());
    updateClock();

    const scheduleNextTick = () => {
      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      return window.setTimeout(
        () => {
          updateClock();
          timer = scheduleNextTick();
        },
        Math.max(delay, 250)
      );
    };

    let timer = scheduleNextTick();
    return () => window.clearTimeout(timer);
  }, []);

  // Format: "Sen 22 Jan 19:30"
  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className="pointer-events-auto fixed left-0 right-0 top-0 flex h-9 select-none items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 text-xs text-black sm:h-8 sm:px-3 lg:px-4 print:hidden"
      style={{ zIndex: Z_LAYERS.CHROME }}
    >
      {/* Left Side */}
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 lg:gap-4">
        <div className="flex shrink-0 cursor-pointer items-center rounded px-2 py-1 pb-1.5 transition-colors hover:bg-black/5">
          {/* Authentic Apple Logo */}
          <svg
            width="15"
            height="18"
            viewBox="0 0 17 20"
            fill="black"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.6661 17.6533C10.7495 18.9959 9.68947 19.9572 8.52947 20C7.61613 20 7.18947 19.6826 6.32947 19.6826C5.4628 19.6826 4.9628 19.6826 4.09613 20C3.0028 19.9714 2.05613 18.9959 1.15613 17.1666C-0.650534 13.9166 -0.563868 8.64731 2.76947 6.84865C3.8428 6.27398 4.71613 6.13131 5.5628 6.13131C6.55613 6.13131 7.22947 6.74465 8.16947 6.74465C9.09613 6.74465 9.77613 5.96598 10.9561 6.13131C11.5161 6.17398 13.0695 6.36065 14.1228 7.89398C14.0761 7.94731 12.0361 9.13131 12.0761 11.5313C12.1161 14.3473 14.5428 15.3087 14.5961 15.3487C14.5828 15.394 14.2295 16.642 13.5628 17.6133L11.6661 17.6533ZM11.1361 4.10065C11.5961 3.52598 11.9161 2.75931 11.8228 1.95665C11.0828 2.02865 10.1961 2.45798 9.66947 3.09798C9.17613 3.65798 8.7628 4.45798 8.87613 5.23131C9.69613 5.29531 10.5561 4.79398 11.1361 4.10065Z" />
          </svg>
        </div>
        <div
          className="hidden max-w-[clamp(5rem,22vw,12rem)] cursor-pointer truncate whitespace-nowrap rounded px-2 py-1 font-bold transition-colors hover:bg-black/5 sm:block"
          onClick={onAbout}
          title={activeWindow}
        >
          {activeWindow}
        </div>
        {/* Menus (Hidden on mobile for simplicity) */}
        <div className="hidden items-center gap-1 font-medium lg:flex">
          {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((menu) => (
            <div
              key={menu}
              className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3"
            >
              {menu}
            </div>
          ))}
        </div>
      </div>

      {/* Center Area - Logout Button (Admin Only) */}
      {isAdmin && (
        <div className="pointer-events-none absolute inset-x-0 flex h-full items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
                Admin Mode
              </span>
            </div>
            <button
              onClick={onLogout}
              className="group flex items-center gap-1.5 px-3 py-1 text-red-600 transition-all hover:text-red-700 active:scale-95"
              title="Sign Out from Admin Session"
            >
              <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span className="text-[11px] font-bold uppercase tracking-tight">Exit Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Right Side */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-5">
        {/* Availability Status */}
        {availability && (
          <div
            className={`hidden max-w-[13rem] items-center gap-2 rounded-full px-2 py-0.5 transition-colors lg:flex ${
              availability.status === 'available'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            <div
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                availability.status === 'available' ? 'animate-pulse bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className="truncate text-[10px] font-medium uppercase tracking-wide">
              {availability.text}
            </span>
          </div>
        )}

        {/* Icons */}
        <div
          className="flex cursor-pointer items-center gap-2 sm:gap-3"
          onClick={onToggleControlCenter}
        >
          <Search
            size={18}
            className="hover:text-gray-600 sm:h-[14px] sm:w-[14px]"
            onClick={(e) => {
              e.stopPropagation();
              if (onSearch) onSearch();
            }}
          />
          <Wifi size={18} className="hidden hover:text-gray-600 sm:block sm:h-[14px] sm:w-[14px]" />

          {/* Custom Battery 100% Green */}
          <span
            className="flex items-center gap-[1px]"
            title="Battery Full (100%)"
            role="img"
            aria-label="Battery 100%"
          >
            <div className="flex h-[11px] w-[22px] items-center justify-center rounded-[2.5px] border border-[#16a34a] bg-[#22c55e]">
              <span
                className="pt-[0.5px] text-[7px] font-bold leading-none text-black"
                aria-hidden="true"
              >
                100
              </span>
            </div>
            <div className="h-[3.5px] w-[1.5px] rounded-r-[1px] bg-[#16a34a] opacity-80" />
          </span>
        </div>

        {/* Clock */}
        <div
          className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 font-medium transition-colors hover:bg-black/5 sm:gap-2 sm:px-2"
          onClick={(e) => {
            e.stopPropagation();
            setShowCalendar(!showCalendar);
          }}
        >
          <span className="hidden lg:inline">{formattedDate}</span>
          <span>{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
