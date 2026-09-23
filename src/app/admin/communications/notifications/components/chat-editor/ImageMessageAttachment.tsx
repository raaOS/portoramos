'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Project } from '@/types/projects';
import AdminFileUpload from '@/app/admin/components/AdminFileUpload';
import { isVideoLink } from '@/lib/media';

interface ImageMessageAttachmentProps {
  messageId: number;
  imageSrc?: string;
  projects: Project[];
  uploadProgress?: number;
  onSetUploadProgress: (messageId: number, progress?: number) => void;
  onSelectImageSrc: (src: string) => void;
}

export function ImageMessageAttachment({
  messageId,
  imageSrc,
  projects,
  uploadProgress,
  onSetUploadProgress,
  onSelectImageSrc,
}: ImageMessageAttachmentProps) {
  return (
    <div className="mb-2 space-y-3">
      {/* Direct Upload Section */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-blue-100/50 bg-blue-50/30 p-2">
        <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">
          Upload Langsung
        </label>
        <div className="group relative">
          <div className="rounded-lg border border-blue-100 bg-white p-3 text-center transition-all hover:border-blue-300">
            <p className="text-[11px] font-medium text-gray-500">
              {uploadProgress === undefined
                ? 'Klik atau Drag untuk Upload'
                : `Uploading ${uploadProgress}%`}
            </p>
            {uploadProgress !== undefined && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-50">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          <div className="absolute inset-0 cursor-pointer overflow-hidden opacity-0">
            <AdminFileUpload
              folder="assets/testimonials"
              multiple={false}
              onUploadStart={() => {
                onSetUploadProgress(messageId, 0);
              }}
              onUploadProgress={(progress) => {
                onSetUploadProgress(messageId, progress);
              }}
              onUploadEnd={() => {
                window.setTimeout(() => {
                  onSetUploadProgress(messageId, undefined);
                }, 800);
              }}
              onUpload={(urls) => {
                if (urls && urls[0]) onSelectImageSrc(urls[0]);
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-gray-200/50"></div>
        <span className="mx-2 flex-shrink text-[9px] font-bold uppercase tracking-widest text-gray-300">
          Atau
        </span>
        <div className="flex-grow border-t border-gray-200/50"></div>
      </div>

      {/* Optional Project Picker for Image Source */}
      <div className="flex flex-col gap-1">
        <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Ambil dari Project
        </label>
        <div className="relative w-full">
          <select
            value=""
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value || proj.slug === e.target.value);
              if (p?.cover) onSelectImageSrc(p.cover);
            }}
            className="w-full cursor-pointer appearance-none rounded-lg border border-black/10 bg-white/70 py-2.5 pl-3 pr-10 text-sm outline-none"
          >
            <option value="">-- Pilih Project (Auto-fill URL) --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id || p.slug}>
                {p.title}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {imageSrc && (
        <div className="mt-2 max-h-48 overflow-hidden rounded-lg border border-white/50 bg-gray-100 shadow-lg">
          {isVideoLink(imageSrc) ? (
            <video
              src={imageSrc + '#t=0.1'}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={imageSrc}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjFmMScvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiNjY2MiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7im6A8L3RleHQ+PC9zdmc+';
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
