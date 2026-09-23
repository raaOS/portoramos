'use client';

import React from 'react';
import { Search, Wifi } from 'lucide-react';
import MusicPlayerWidget from '../../ui/MusicWidget';
import LanguageSwitch from '@/components/shared/LanguageSwitch';
import { MenuBarBatteryIndicator } from './MenuBarBatteryIndicator';

interface MenuBarStatusItemsProps {
  availability?: {
    status: string;
    text: string;
  };
  availabilityText?: string;
  batteryFullLabel: string;
  formattedDate: string;
  formattedTime: string;
  showCalendar: boolean;
  onSearch?: () => void;
  onToggleControlCenter?: () => void;
  onToggleCalendar: () => void;
}

export function MenuBarStatusItems({
  availability,
  availabilityText,
  batteryFullLabel,
  formattedDate,
  formattedTime,
  onSearch,
  onToggleControlCenter,
  onToggleCalendar,
}: MenuBarStatusItemsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
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
            {availabilityText}
          </span>
        </div>
      )}

      <MusicPlayerWidget />
      <LanguageSwitch className="hidden md:inline-grid" />

      {/* Control center & quick tools */}
      <div
        className="flex cursor-pointer items-center gap-1.5 sm:gap-3"
        onClick={onToggleControlCenter}
      >
        <button
          type="button"
          className="flex h-7 w-7 touch-manipulation items-center justify-center rounded p-1 hover:bg-black/5 hover:text-gray-600 sm:h-auto sm:w-auto sm:p-0"
          onClick={(e) => {
            e.stopPropagation();
            if (onSearch) onSearch();
          }}
          aria-label="Search"
        >
          <Search size={18} className="sm:h-[14px] sm:w-[14px]" />
        </button>
        <Wifi size={18} className="hidden hover:text-gray-600 sm:block sm:h-[14px] sm:w-[14px]" />

        <MenuBarBatteryIndicator label={batteryFullLabel} />
      </div>

      {/* Clock */}
      <div
        className="flex cursor-pointer touch-manipulation items-center gap-1 rounded px-1.5 py-1 font-medium transition-colors hover:bg-black/5 sm:gap-2 sm:px-2"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCalendar();
        }}
      >
        <span className="hidden lg:inline">{formattedDate}</span>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
}
