'use client';

import React from 'react';
import { FileText, ExternalLink, Trash2, Upload } from 'lucide-react';
import { getProxiedUrl } from '@/lib/utils';

interface ProjectPdfUploadCardProps {
  pdfUrl?: string;
  pendingPdfFile: File | null;
  pdfUploadProgress: number | null;
  pdfInputRef: React.RefObject<HTMLInputElement | null>;
  onPdfSelect: (file: File) => void;
  onRemovePdf: () => void;
}

export function ProjectPdfUploadCard({
  pdfUrl,
  pendingPdfFile,
  pdfUploadProgress,
  pdfInputRef,
  onPdfSelect,
  onRemovePdf,
}: ProjectPdfUploadCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
          <FileText className="h-4 w-4" />
          Berkas Dokumen PDF
        </span>
        {pdfUrl && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            PDF Terpasang
          </span>
        )}
      </label>

      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPdfSelect(file);
        }}
      />

      {pdfUrl ? (
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {pendingPdfFile ? pendingPdfFile.name : 'Dokumen PDF Project'}
                </p>
                {pendingPdfFile && (
                  <p className="text-[10px] text-neutral-400">
                    {(pendingPdfFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!pendingPdfFile && pdfUrl && (
                <a
                  href={getProxiedUrl(pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                  title="Buka PDF di tab baru"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={onRemovePdf}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                title="Hapus PDF"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {pdfUploadProgress !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${pdfUploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => pdfInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 dark:border-neutral-700 dark:bg-neutral-800/30 dark:hover:border-blue-500/50"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Klik untuk upload file PDF
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Mendukung berkas presentasi, deck, atau dokumen portofolio (.pdf)
          </p>
        </div>
      )}
    </div>
  );
}
