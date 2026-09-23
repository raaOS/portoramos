'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ProjectCoverUploadCardProps {
  coverPreviewUrl: string | null;
  coverUploadProgress: number | null;
  isDetectingDimensions: boolean;
  coverError?: string;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onCoverSelect: (file: File) => void;
}

export function ProjectCoverUploadCard({
  coverPreviewUrl,
  coverUploadProgress,
  isDetectingDimensions,
  coverError,
  coverInputRef,
  onCoverSelect,
}: ProjectCoverUploadCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
        <span className="flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          Cover / Thumbnail <span className="text-red-500">*</span>
        </span>
        {isDetectingDimensions && (
          <span className="text-[10px] text-blue-500">Mendeteksi dimensi...</span>
        )}
      </label>

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCoverSelect(file);
        }}
      />

      {coverPreviewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <img src={coverPreviewUrl} alt="Cover preview" className="h-48 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow backdrop-blur hover:bg-white"
            >
              Ganti Gambar
            </button>
          </div>
          {coverUploadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${coverUploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => coverInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 dark:border-neutral-700 dark:bg-neutral-800/30 dark:hover:border-blue-500/50"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-200/60 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Klik untuk upload gambar cover
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Dipakai untuk ikon folder desktop OS simulator dan kartu preview
          </p>
        </div>
      )}
      {coverError && <p className="mt-1.5 text-xs text-red-500">{coverError}</p>}
    </div>
  );
}
