'use client';

import React from 'react';
import { Tag, Building, Calendar } from 'lucide-react';
import type { Label } from '@/types/labels';
import type { ProjectFormData } from '@/hooks/useProjectForm';

interface ProjectMetadataFieldsProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  labels: Label[];
  updateField: <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => void;
  onToggleTag: (tagSlug: string) => void;
}

export function ProjectMetadataFields({
  formData,
  errors,
  labels,
  updateField,
  onToggleTag,
}: ProjectMetadataFieldsProps) {
  return (
    <div className="space-y-4 lg:col-span-6">
      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          Judul Project <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Contoh: Redesign Aplikasi Mobile Bank"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          required
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Category / Tags */}
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          <Tag className="h-3.5 w-3.5" />
          <span>Kategori & Tag</span>
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => updateField('tags', e.target.value)}
          placeholder="UI/UX, Mobile App, Branding (pisahkan koma)"
          className="mb-2 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {labels.map((lbl) => {
              const isSelected = formData.tags
                ?.split(',')
                .map((t) => t.trim().toLowerCase())
                .includes(lbl.slug.toLowerCase());
              return (
                <button
                  key={lbl.id || lbl.slug}
                  type="button"
                  onClick={() => onToggleTag(lbl.slug)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {lbl.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Client & Year */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            <Building className="h-3 w-3" />
            <span>Klien / Instansi</span>
          </label>
          <input
            type="text"
            value={formData.client}
            onChange={(e) => updateField('client', e.target.value)}
            placeholder="Contoh: PT. Maju Bersama"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            <Calendar className="h-3 w-3" />
            <span>Tahun</span>
          </label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) =>
              updateField('year', parseInt(e.target.value) || new Date().getFullYear())
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          Deskripsi Singkat
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          placeholder="Penjelasan ringkas tentang karya/project ini..."
          className="w-full resize-none rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
      </div>
    </div>
  );
}
