'use client';

import React from 'react';
import { AlertTriangle, Image as ImageIcon, Film } from 'lucide-react';
import type { StorageCategoryStats } from '../../../hooks/useStorageStats';
import { NoteHint } from './NoteHint';

interface StorageCategoryRowProps {
  category: StorageCategoryStats;
}

export function StorageCategoryRow({ category }: StorageCategoryRowProps) {
  const hasMismatch = category.orphans > 0 || category.dangling > 0;
  const [showNote, setShowNote] = React.useState(false);

  return (
    <li className="rounded-md px-1.5 py-1.5 transition-colors hover:bg-black/5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-zinc-700" title={category.prefix}>
          {category.label}
        </span>
        <div className="flex items-center gap-1.5">
          {category.note && (
            <NoteHint
              text={category.note}
              isOpen={showNote}
              onToggle={() => setShowNote((v) => !v)}
              onClose={() => setShowNote(false)}
            />
          )}
          {hasMismatch ? (
            <span
              className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800"
              title={`${category.orphans} orphan, ${category.dangling} dangling`}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              mismatch
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              sync
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-1.5 text-[10px] text-zinc-500">
        <div
          className="rounded bg-black/[0.03] px-1.5 py-1"
          title="D1 = jumlah URL yang admin pilih (cover, gallery, wallpaper, dsb.)."
        >
          <div className="text-[9px] uppercase tracking-wider text-zinc-400">
            D1 <span className="font-normal normal-case text-zinc-400/80">database</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-700">
            <span title="Total URL tercatat">{category.d1.total}</span>
            <span
              className="flex items-center gap-0.5 text-zinc-500"
              title={`${category.d1.image} image`}
            >
              <ImageIcon className="h-2.5 w-2.5" />
              {category.d1.image}
            </span>
            <span
              className="flex items-center gap-0.5 text-zinc-500"
              title={`${category.d1.video} video`}
            >
              <Film className="h-2.5 w-2.5" />
              {category.d1.video}
            </span>
          </div>
        </div>
        <div
          className="rounded bg-black/[0.03] px-1.5 py-1"
          title={
            category.sidecarCount > 0
              ? `R2 = file fisik di bucket. Termasuk ${category.sidecarCount} file pendamping (preview/poster) yang otomatis dibuat untuk video.`
              : 'R2 = file fisik di bucket.'
          }
        >
          <div className="text-[9px] uppercase tracking-wider text-zinc-400">
            R2 <span className="font-normal normal-case text-zinc-400/80">bucket</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-700">
            <span title="Total object di prefix">{category.r2.total}</span>
            <span
              className="flex items-center gap-0.5 text-zinc-500"
              title={`${category.r2.image} image`}
            >
              <ImageIcon className="h-2.5 w-2.5" />
              {category.r2.image}
            </span>
            <span
              className="flex items-center gap-0.5 text-zinc-500"
              title={`${category.r2.video} video`}
            >
              <Film className="h-2.5 w-2.5" />
              {category.r2.video}
            </span>
          </div>
        </div>
      </div>

      {hasMismatch && (
        <div className="mt-1 flex flex-wrap gap-2 text-[9px] text-amber-800">
          {category.orphans > 0 && (
            <span title="Object di R2 tanpa referensi D1 — kandidat untuk dihapus.">
              {category.orphans} orphan
            </span>
          )}
          {category.dangling > 0 && (
            <span title="URL di D1 yang object-nya hilang dari R2.">
              {category.dangling} dangling
            </span>
          )}
        </div>
      )}
    </li>
  );
}
