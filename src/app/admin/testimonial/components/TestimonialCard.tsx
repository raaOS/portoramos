'use client';

import React from 'react';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { Testimonial } from '@/types/testimonial';
import StatusToggle from '../../components/StatusToggle';
import { getAvatarUrl, getAvatarColors } from '@/lib/avatar';

interface TestimonialCardProps {
    testimonial: Testimonial;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
}

export default function TestimonialCard({ testimonial: t, onEdit, onDelete, onToggleStatus }: TestimonialCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all hover:border-violet-200 group relative">
            <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center font-bold shrink-0"
                        style={{
                            backgroundColor: `#${getAvatarColors(t.name).bg}`,
                            color: `#${getAvatarColors(t.name).text}`
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getAvatarUrl(t.name)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-sm">{t.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={10} /> {t.messages?.length || 0} Chat
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <StatusToggle
                        isActive={t.isActive !== false}
                        onClick={onToggleStatus}
                    />
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl mb-4 text-xs italic text-gray-600 border border-gray-100 line-clamp-2">
                &quot;{t.notificationText}&quot;
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-4">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                    <Pencil size={16} />
                </button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
