'use client';

import React, { useState } from 'react';
import { HardDrive, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import type { StorageStatsState } from '../../hooks/useStorageStats';
import { StorageGlossary } from './storage-breakdown/StorageGlossary';
import { StorageCategoryRow } from './storage-breakdown/StorageCategoryRow';

interface StorageBreakdownSectionProps {
  state: StorageStatsState;
  onRefresh: () => void;
}

export function StorageBreakdownSection({ state, onRefresh }: StorageBreakdownSectionProps) {
  const data =
    state.status === 'ready'
      ? state.data
      : state.status === 'loading' || state.status === 'error'
        ? state.data
        : null;

  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <div className="rounded-lg border border-black/5 bg-white/40 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
          <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
          Storage breakdown
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGlossary((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${
              showGlossary ? 'text-blue-600' : 'text-zinc-500 hover:text-blue-600'
            }`}
            title="Bantuan istilah"
            aria-label="Toggle istilah"
            aria-expanded={showGlossary}
          >
            <HelpCircle className="h-3 w-3" />
            Help
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:text-blue-600 disabled:opacity-50 disabled:hover:text-zinc-500"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showGlossary && <StorageGlossary />}

      {isError && (
        <div className="mx-1 mb-2 rounded-md bg-rose-50 px-2 py-1.5 text-[10px] text-rose-700">
          {state.message}
        </div>
      )}

      {!data && !isLoading && !isError && (
        <div className="px-1 py-1 text-[10px] text-zinc-500">
          Buka popout untuk memuat ringkasan storage.
        </div>
      )}

      {data && data.categories.length === 0 && (
        <div className="px-1 py-1 text-[10px] text-zinc-500">
          Belum ada kategori yang terdaftar.
        </div>
      )}

      {data && data.categories.length > 0 && (
        <ul className="space-y-1.5">
          {data.categories.map((cat) => (
            <StorageCategoryRow key={cat.id} category={cat} />
          ))}
        </ul>
      )}

      {data && data.warnings.length > 0 && (
        <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
          <div className="flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Warnings
          </div>
          <ul className="mt-0.5 list-disc pl-3">
            {data.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
