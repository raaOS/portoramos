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

export default function ExperienceCard({
  work,
  onEdit,
  onDelete,
  onToggleStatus,
}: ExperienceCardProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-1 items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
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
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <BriefcaseBusiness className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-bold text-gray-900">{work.position}</h4>
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
            <span className="font-medium text-gray-800">{work.company}</span>
            <span className="text-gray-300">•</span>
            <span>{work.year}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">{work.duration}</span>
          </div>
          <ul className="list-outside list-disc space-y-1 pl-4">
            {work.description.slice(0, 3).map((desc, i) => (
              <li key={i} className="text-sm leading-snug text-gray-600">
                {desc}
              </li>
            ))}
            {work.description.length > 3 && (
              <li className="text-xs italic text-gray-400">
                +{work.description.length - 3} more items...
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
        <StatusToggle
          isActive={work.isActive !== false}
          onClick={onToggleStatus}
          className="mr-auto"
        />
        <button
          onClick={onEdit}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
