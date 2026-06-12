/**
 * Project Card Skeleton — Placeholder animasi untuk kartu proyek.
 *
 * Menampilkan skeleton loading animation yang menyerupai layout kartu
 * proyek saat data sedang dimuat dari database.
 *
 * @module components/admin/ProjectCardSkeleton
 */
import React from 'react';

export default function ProjectCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Image Skeleton */}
      <div className="relative aspect-video w-full bg-gray-200" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 space-y-3">
          {/* Title & Toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-8 rounded-full bg-gray-200" />
          </div>

          {/* Metadata */}
          <div className="h-4 w-1/3 rounded bg-gray-200" />

          {/* Description (2 lines) */}
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-auto flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <div className="h-8 w-12 rounded-lg bg-gray-200" />
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
