'use client';

import React from 'react';
import { LogOut } from 'lucide-react';

interface MenuBarAdminBadgeProps {
  isAdmin?: boolean;
  adminModeLabel: string;
  exitAdminLabel: string;
  onLogout?: () => void;
}

export function MenuBarAdminBadge({
  isAdmin,
  adminModeLabel,
  exitAdminLabel,
  onLogout,
}: MenuBarAdminBadgeProps) {
  if (!isAdmin) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 flex h-full items-center justify-center">
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
            {adminModeLabel}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="group flex items-center gap-1.5 px-3 py-1 text-red-600 transition-all hover:text-red-700 active:scale-95"
          title={exitAdminLabel}
        >
          <LogOut size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-[11px] font-bold uppercase tracking-tight">
            {exitAdminLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
