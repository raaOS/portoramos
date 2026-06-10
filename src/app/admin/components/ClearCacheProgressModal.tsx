'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Circle, Loader2, RotateCcw, X } from 'lucide-react';

export type ClearCacheStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

export interface ClearCacheProgressStep {
  id: string;
  label: string;
  status: ClearCacheStepStatus;
  detail?: string;
}

interface ClearCacheProgressModalProps {
  isOpen: boolean;
  steps: ClearCacheProgressStep[];
  canClose: boolean;
  onClose: () => void;
}

function iconFor(status: ClearCacheStepStatus) {
  if (status === 'running') {
    return <Loader2 className="h-4 w-4 animate-spin text-sky-500" />;
  }
  if (status === 'done') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
  if (status === 'skipped') {
    return <RotateCcw className="h-4 w-4 text-amber-500" />;
  }
  if (status === 'error') {
    return <AlertTriangle className="h-4 w-4 text-rose-500" />;
  }
  return <Circle className="h-4 w-4 text-zinc-300" />;
}

function labelFor(status: ClearCacheStepStatus) {
  if (status === 'running') return 'Proses';
  if (status === 'done') return 'Selesai';
  if (status === 'skipped') return 'Dilewati';
  if (status === 'error') return 'Gagal';
  return 'Menunggu';
}

function statusClass(status: ClearCacheStepStatus) {
  if (status === 'running') return 'bg-sky-50 text-sky-700 ring-sky-100';
  if (status === 'done') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (status === 'skipped') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (status === 'error') return 'bg-rose-50 text-rose-700 ring-rose-100';
  return 'bg-zinc-50 text-zinc-500 ring-zinc-100';
}

export function ClearCacheProgressModal({
  isOpen,
  steps,
  canClose,
  onClose,
}: ClearCacheProgressModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPortalRoot(document.body);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!isOpen || !portalRoot) return null;

  const finishedSteps = steps.filter((step) =>
    ['done', 'skipped', 'error'].includes(step.status)
  ).length;
  const hasError = steps.some((step) => step.status === 'error');
  const allFinished = finishedSteps === steps.length;
  const progress = Math.round((finishedSteps / steps.length) * 100);

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(720px,calc(100dvh-96px))] w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-300 bg-white text-zinc-800">
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Clear Cache</div>
            <div className="mt-1 text-xs text-zinc-500">
              {allFinished
                ? hasError
                  ? 'Selesai dengan beberapa error'
                  : 'Semua proses selesai'
                : 'Membersihkan cache bertahap'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!canClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
            <span>
              {finishedSteps}/{steps.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                hasError && allFinished ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2.5"
            >
              <div className="mt-0.5">{iconFor(step.status)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-zinc-800">{step.label}</div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusClass(
                      step.status
                    )}`}
                  >
                    {labelFor(step.status)}
                  </span>
                </div>
                {step.detail ? (
                  <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-zinc-500">
                    {step.detail}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-zinc-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={!canClose}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
}
