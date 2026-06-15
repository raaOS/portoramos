'use client';

import React from 'react';
import { Settings, List, RefreshCw } from 'lucide-react';
import PopoutShell from './PopoutShell';

interface SettingsPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenPasswordModal: () => void;
  onClearCache: () => void;
  onOpenActivityLog: () => void;
  isClearingCache: boolean;
}

export function SettingsPopout({
  isOpen,
  onClose,
  anchorRef,
  onOpenPasswordModal,
  onClearCache,
  onOpenActivityLog,
  isClearingCache,
}: SettingsPopoutProps) {
  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={240}>
      <div className="space-y-1 p-2">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Pengaturan Admin
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenPasswordModal();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5"
        >
          <Settings size={14} className="text-zinc-500" />
          <span className="font-medium">Keamanan & Sandi</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenActivityLog();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5"
        >
          <List size={14} className="text-zinc-500" />
          <span className="font-medium">Log Aktivitas</span>
        </button>

        <div className="my-1 h-px w-full bg-black/5" />

        <button
          onClick={() => {
            if (!isClearingCache) {
              onClearCache();
              onClose();
            }
          }}
          disabled={isClearingCache}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={`text-zinc-500 ${isClearingCache ? 'animate-spin' : ''}`}
          />
          <span className="font-medium">{isClearingCache ? 'Membersihkan...' : 'Clear Cache'}</span>
        </button>
      </div>
    </PopoutShell>
  );
}
