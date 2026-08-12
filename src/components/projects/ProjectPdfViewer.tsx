'use client';

import React, { useState } from 'react';
import type { Project } from '@/types/projects';
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Info,
  Calendar,
  Building,
} from 'lucide-react';
import { getProxiedUrl } from '@/lib/utils';

interface ProjectPdfViewerProps {
  project: Project;
  isWindowMode?: boolean;
}

export default function ProjectPdfViewer({
  project,
  isWindowMode: _isWindowMode = true,
}: ProjectPdfViewerProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'cover'>(
    project.pdfUrl ? 'pdf' : 'cover'
  );

  const pdfUrl = project.pdfUrl ? getProxiedUrl(project.pdfUrl) : null;
  const coverUrl = project.cover ? getProxiedUrl(project.cover) : null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${project.slug || 'project'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Top Controls & Document Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white/80 px-4 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/80 sm:px-6">
        {/* Left: Title & Meta badges */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight text-neutral-900 dark:text-white sm:text-base">
              {project.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              {project.client && (
                <span className="flex items-center gap-1 truncate font-medium">
                  <Building className="h-3 w-3" />
                  {project.client}
                </span>
              )}
              {project.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {project.year}
                </span>
              )}
              {project.tags && project.tags.length > 0 && (
                <span className="hidden rounded bg-neutral-200/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 md:inline-block">
                  {project.tags[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions & Tab Switcher */}
        <div className="flex items-center gap-2">
          {/* Tab switch if both PDF and Cover exist */}
          {pdfUrl && coverUrl && (
            <div className="flex items-center rounded-lg border border-black/5 bg-neutral-200/60 p-0.5 dark:border-white/5 dark:bg-neutral-800/80">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'pdf'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => setActiveTab('cover')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'cover'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Cover</span>
              </button>
            </div>
          )}

          {/* Download & External Open */}
          {pdfUrl && (
            <>
              <button
                onClick={handleDownload}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                title="Download PDF"
              >
                <Download className="h-3.5 w-3.5 text-blue-500" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={handleOpenExternal}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                title="Buka di Tab Baru"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden bg-neutral-200/50 dark:bg-neutral-900/50">
        {activeTab === 'pdf' && pdfUrl ? (
          <div className="h-full w-full">
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              title={project.title}
              className="h-full w-full border-0 bg-white dark:bg-neutral-950"
            />
          </div>
        ) : activeTab === 'cover' && coverUrl ? (
          <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
            <div className="relative max-h-full max-w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
              <img
                src={coverUrl}
                alt={project.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
              {project.description && (
                <div className="border-t border-black/5 bg-white/90 p-4 backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/90">
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty / Fallback State */
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
              <Info className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Dokumen PDF Belum Tersedia
            </h3>
            <p className="mt-1.5 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
              File PDF untuk project "{project.title}" belum diunggah. Anda dapat mengunggah file PDF
              melalui Admin Panel.
            </p>
            {coverUrl && (
              <button
                onClick={() => setActiveTab('cover')}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-blue-700"
              >
                <ImageIcon className="h-4 w-4" />
                Lihat Cover Gambar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
