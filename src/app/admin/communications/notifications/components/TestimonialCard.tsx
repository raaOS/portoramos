'use client';

import React from 'react';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';
import StatusToggle from '../../../components/StatusToggle';
import { getAvatarUrl, getAvatarColors } from '@/lib/avatar';

interface TestimonialCardProps {
  testimonial: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export default function TestimonialCard({
  testimonial: t,
  onEdit,
  onDelete,
  onToggleStatus,
}: TestimonialCardProps) {
  return (
    <div className="group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-violet-200 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 font-bold"
            style={{
              backgroundColor: `#${getAvatarColors(t.name).bg}`,
              color: `#${getAvatarColors(t.name).text}`,
            }}
          >
            <img src={getAvatarUrl(t.name)} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-gray-900">{t.name}</h4>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock size={10} /> {t.messages?.length || 0} Chat
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <StatusToggle isActive={t.isActive !== false} onClick={onToggleStatus} />
        </div>
      </div>

      <div className="mb-4 line-clamp-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs italic text-gray-600">
        &quot;{t.notificationText}&quot;
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-4">
        <button
          onClick={onEdit}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-600"
          title="Edit Testimonial"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
          title="Hapus Testimonial"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
