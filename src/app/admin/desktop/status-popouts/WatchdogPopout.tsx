'use client';

import React from 'react';
import { Shield, Activity, Bot, Cloud, RefreshCw } from 'lucide-react';
import PopoutShell from './PopoutShell';

export type WatchdogStatusKind =
  | 'checking'
  | 'healthy'
  | 'local-polling'
  | 'watchdog-stale'
  | 'needs-restore'
  | 'error';

export interface WatchdogStatusData {
  status: WatchdogStatusKind;
  message?: string;
  webhook?: {
    state?: 'ok' | 'not-set' | 'mismatch';
    currentUrl?: string;
    expectedUrl?: string;
    pendingUpdates?: number;
    lastErrorMessage?: string | null;
  };
  lease?: {
    active?: boolean;
    heartbeatAt?: number | null;
    expiresAt?: number | null;
    expiredAt?: number | null;
    restoreWebhookUrl?: string | null;
    previousWebhookUrl?: string | null;
  };
  watchdog?: {
    configured?: boolean;
    lastRunAt?: number | null;
    lastAction?: string | null;
    lastReason?: string | null;
    lastOk?: boolean | null;
    ageMs?: number | null;
    recent?: boolean;
  };
}

interface WatchdogPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  status: WatchdogStatusData;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const WATCHDOG_LABEL: Record<WatchdogStatusKind, string> = {
  checking: 'Memeriksa...',
  healthy: 'Production sehat',
  'local-polling': 'Local polling aktif',
  'watchdog-stale': 'Watchdog telat',
  'needs-restore': 'Perlu restore',
  error: 'Bermasalah',
};

const WATCHDOG_DOT: Record<WatchdogStatusKind, string> = {
  checking: 'bg-amber-400',
  healthy: 'bg-emerald-400',
  'local-polling': 'bg-amber-400',
  'watchdog-stale': 'bg-amber-400',
  'needs-restore': 'bg-rose-500',
  error: 'bg-rose-500',
};

const WATCHDOG_ICON: Record<WatchdogStatusKind, string> = {
  checking: 'text-amber-500',
  healthy: 'text-emerald-500',
  'local-polling': 'text-amber-500',
  'watchdog-stale': 'text-amber-500',
  'needs-restore': 'text-rose-500',
  error: 'text-rose-500',
};

const WATCHDOG_REASON: Record<WatchdogStatusKind, string> = {
  checking: 'Kuning karena admin sedang membaca status watchdog.',
  healthy: 'Hijau karena webhook job bot OK dan external watchdog baru saja berjalan.',
  'local-polling': 'Kuning karena npm run dev sedang mengambil alih job bot di local.',
  'watchdog-stale': 'Kuning karena webhook OK, tapi external watchdog belum update baru.',
  'needs-restore': 'Merah karena webhook job bot NOT SET/MISMATCH dan perlu restore.',
  error: 'Merah karena status watchdog gagal dibaca.',
};

function formatTime(value?: number | null) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAge(value?: number | null) {
  if (typeof value !== 'number') return '-';
  if (value < 60_000) return '<1 menit';
  return `${Math.round(value / 60_000)} menit lalu`;
}

function formatWebhookState(state?: string) {
  if (state === 'ok') return 'OK';
  if (state === 'not-set') return 'NOT SET';
  if (state === 'mismatch') return 'MISMATCH';
  return '-';
}

function StatusLegend() {
  return (
    <div className="grid grid-cols-3 gap-1 px-2 pt-1 text-[10px] text-zinc-500">
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Online
      </span>
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
        Checking
      </span>
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
        Offline
      </span>
    </div>
  );
}

export function WatchdogPopout({
  isOpen,
  onClose,
  anchorRef,
  status,
  onRefresh,
  isRefreshing,
}: WatchdogPopoutProps) {
  const lastRunLabel = status.watchdog?.lastRunAt
    ? `${formatTime(status.watchdog.lastRunAt)} (${formatAge(status.watchdog.ageMs)})`
    : '-';

  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={300}>
      <div className="border-b border-black/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
            <Bot className={`h-5 w-5 ${WATCHDOG_ICON[status.status]}`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800">Telegram Watchdog</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${WATCHDOG_DOT[status.status]}`} />
              {WATCHDOG_LABEL[status.status]}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 disabled:opacity-50"
            disabled={isRefreshing}
            title="Refresh watchdog status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs text-zinc-500">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            Webhook
          </span>
          <span className="font-medium text-zinc-700">
            {formatWebhookState(status.webhook?.state)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            Pending
          </span>
          <span className="font-medium text-zinc-700">
            {typeof status.webhook?.pendingUpdates === 'number'
              ? status.webhook.pendingUpdates
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-zinc-400" />
            Last run
          </span>
          <span className="font-medium text-zinc-700">{lastRunLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-zinc-400" />
            Local lease
          </span>
          <span className="font-medium text-zinc-700">
            {status.lease?.active
              ? `aktif sampai ${formatTime(status.lease.expiresAt)}`
              : 'tidak aktif'}
          </span>
        </div>
        <div className="rounded-lg bg-black/5 px-2 py-2 text-[11px] text-zinc-600">
          {WATCHDOG_REASON[status.status]}
        </div>
        {status.message || status.webhook?.lastErrorMessage ? (
          <div className="rounded-lg bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
            {status.message || status.webhook?.lastErrorMessage}
          </div>
        ) : null}
        <StatusLegend />
      </div>

      <div className="flex justify-center border-t border-black/5 p-3">
        <img
          src="https://api.cron-job.org/jobs/7682218/ee129eecefaabbd6/status-7.svg"
          alt="Telegram Watchdog Status"
          className="pointer-events-none h-5 w-auto select-none rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Cron Job
      </div>
    </PopoutShell>
  );
}
