import React from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Copy, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { Project } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { getIconMap } from '@/constants/skillIcons';
import StatusToggle from '../../components/StatusToggle';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

interface ProjectCardProps {
  project: Project;
  selectedProjectIds: Set<string>;
  toggleProjectSelection: (id: string) => void;
  handleToggleProjectStatus: (project: Project) => void;
  setEditingProject: (project: Project) => void;
  handleDeleteProject: (id: string) => void;
  handleDuplicateProject: (project: Project) => void;
  setManagingCommentsProject: (project: Project) => void;
  commentCount?: number;
  priority?: boolean;
  eager?: boolean;
}

export const ProjectCard = ({
  project,
  selectedProjectIds,
  toggleProjectSelection,
  handleToggleProjectStatus,
  setEditingProject,
  handleDeleteProject,
  handleDuplicateProject,
  setManagingCommentsProject,
  commentCount: _commentCount = 0,
  priority = false,
  eager = false,
}: ProjectCardProps) => {
  const isPublished = project.status === 'published';
  const shouldLoadEagerly = priority || eager;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* Selection Checkbox Overlay */}
        <div
          className={`absolute left-2 top-2 z-10 transition-opacity duration-200 ${selectedProjectIds.has(project.id) || 'opacity-0 group-hover:opacity-100'}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selectedProjectIds.has(project.id)}
            onChange={() => toggleProjectSelection(project.id)}
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-violet-600 shadow-sm focus:ring-violet-500"
          />
        </div>

        {isVideoLink(project.cover) ? (
          <video
            src={project.cover + '#t=0.1'}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={project.cover || FALLBACK_IMAGE}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={shouldLoadEagerly ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3
              className="line-clamp-1 flex-1 cursor-pointer text-lg font-bold text-gray-900 hover:text-violet-600"
              title={project.title}
              onClick={() => toggleProjectSelection(project.id)}
            >
              {project.title}
            </h3>
            <div onPointerDown={(e) => e.stopPropagation()}>
              <StatusToggle
                isActive={isPublished}
                onClick={() => handleToggleProjectStatus(project)}
                className="flex-shrink-0"
                iconActive={<Eye className="h-4 w-4" />}
                iconInactive={<EyeOff className="h-4 w-4" />}
                labelActive=""
                labelInactive=""
              />
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-violet-600">
              {project.client} • {project.year}
            </p>
            <div className="flex items-center gap-1.5 opacity-60 grayscale">
              {project.software?.slice(0, 3).map((s) => (
                <div key={s} title={s.replace('_', ' ')} className="h-4 w-4">
                  {getIconMap('w-full h-full')[s.toLowerCase()] || (
                    <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-[6px] font-bold uppercase text-gray-500">
                      {s.slice(0, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="line-clamp-2 text-sm text-gray-500">{project.description}</p>
        </div>

        <div
          className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditingProject(project)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-600"
            title="Edit Project"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDuplicateProject(project)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
            title="Duplicate Project"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProject(project.id)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setManagingCommentsProject(project)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-600"
            title="Manage Comments"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
