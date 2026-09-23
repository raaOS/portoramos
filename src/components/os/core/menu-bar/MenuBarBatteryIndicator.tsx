'use client';

import React from 'react';

interface MenuBarBatteryIndicatorProps {
  label: string;
}

export function MenuBarBatteryIndicator({ label }: MenuBarBatteryIndicatorProps) {
  return (
    <span
      className="flex items-center gap-[1px]"
      title={label}
      role="img"
      aria-label={label}
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
  );
}
