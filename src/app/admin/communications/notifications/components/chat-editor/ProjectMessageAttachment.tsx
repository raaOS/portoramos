'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Project } from '@/types/projects';
import { isVideoLink } from '@/lib/media';

interface ProjectMessageAttachmentProps {
  projectId?: string;
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export function ProjectMessageAttachment({
  projectId,
  projects,
  onSelectProject,
}: ProjectMessageAttachmentProps) {
  const linkedProject = projects.find((p) => p.id === projectId || p.slug === projectId);

  return (
    <div className="mb-2">
      <div className="relative mb-2 w-full">
        <select
          value={projectId || ''}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-black/10 bg-white/70 py-2.5 pl-3 pr-10 text-sm outline-none"
        >
          <option value="">-- Pilih Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id || p.slug}>
              {p.title} {p.client ? `- ${p.client}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Project Preview */}
      {linkedProject && (
        <div className="mt-2 overflow-hidden rounded-lg border border-black/10 bg-white/80">
          {linkedProject.cover ? (
            <div className="relative h-24 bg-gray-100">
              {isVideoLink(linkedProject.cover) ? (
                <video
                  src={linkedProject.cover + '#t=0.1'}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={linkedProject.cover}
                  alt={`${linkedProject.title} - ${linkedProject.client || 'Project'}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="truncate text-xs font-bold text-white">{linkedProject.title}</p>
                <p className="truncate text-[10px] text-white/80">{linkedProject.client}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
              <span className="text-xs font-bold text-white">{linkedProject.title}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
