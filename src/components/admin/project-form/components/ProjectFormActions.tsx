'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';

interface ProjectFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ProjectFormActions({
  isSubmitting,
  onCancel,
  onSubmit,
}: ProjectFormActionsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            <span>Simpan Project</span>
          </>
        )}
      </button>
    </div>
  );
}
