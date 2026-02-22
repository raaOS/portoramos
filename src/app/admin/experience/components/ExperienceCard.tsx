'use client';

import React from 'react';
import Image from 'next/image';
import { Pencil, Trash2, BriefcaseBusiness } from 'lucide-react';
import { WorkExperience } from '@/types/experience';
import StatusToggle from '../../components/StatusToggle';

interface ExperienceCardProps {
    work: WorkExperience;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
}

export default function ExperienceCard({ work, onEdit, onDelete, onToggleStatus }: ExperienceCardProps) {
    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-start gap-4 flex-1">
                <div className="relative w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                    {work.imageUrl ? (
                        <Image
                            src={work.imageUrl}
                            alt={work.company}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-300">
                            <BriefcaseBusiness className="w-8 h-8" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 truncate">{work.position}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-800">{work.company}</span>
                        <span className="text-gray-300">•</span>
                        <span>{work.year}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500">{work.duration}</span>
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-1">
                        {work.description.slice(0, 3).map((desc, i) => (
                            <li key={i} className="text-sm text-gray-600 leading-snug">{desc}</li>
                        ))}
                        {work.description.length > 3 && (
                            <li className="text-xs text-gray-400 italic">+{work.description.length - 3} more items...</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <StatusToggle
                    isActive={work.isActive !== false}
                    onClick={onToggleStatus}
                    className="mr-auto"
                />
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
