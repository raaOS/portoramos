'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { AnyExplorerNode } from '@/types/explorer';
import { getExplorerNodeDisplayName } from '@/lib/utils/explorerName';

export type MoveTarget = {
  id: string | null;
  label: string;
};

interface MoveDialogProps {
  node: AnyExplorerNode;
  targets: MoveTarget[];
  selectedParentId: string | null;
  onChangeSelectedParentId: (id: string | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function MoveDialog({
  node,
  targets,
  selectedParentId,
  onChangeSelectedParentId,
  onClose,
  onSubmit,
}: MoveDialogProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Pindah item</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pilih folder tujuan untuk "{getExplorerNodeDisplayName(node)}".
          </p>
        </div>
        <div className="space-y-2 px-5 py-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Folder tujuan
          </label>
          <div className="relative w-full">
            <select
              value={selectedParentId || 'root'}
              onChange={(event) =>
                onChangeSelectedParentId(event.target.value === 'root' ? null : event.target.value)
              }
              className="w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {targets.map((target) => (
                <option key={target.id || 'root'} value={target.id || 'root'}>
                  {target.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Pindah
          </button>
        </div>
      </div>
    </div>
  );
}
