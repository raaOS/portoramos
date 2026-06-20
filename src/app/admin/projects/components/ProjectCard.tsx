import React from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Eye, EyeOff, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Project } from '@/types/projects';
import { isVideoLink } from '@/lib/media';
import { getIconMap } from '@/constants/skillIcons';
import StatusToggle from '../../components/StatusToggle';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300/CCCCCC/666666?text=No+Image';

function formatEngagementCount(value?: number) {
  const count = Number(value) || 0;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

interface ProjectCardProps {
  project: Project;
  selectedProjectIds: Set<string>;
  toggleProjectSelection: (id: string) => void;
  handleToggleProjectStatus: (project: Project) => void;
  setEditingProject: (project: Project) => void;
  handleDeleteProject: (id: string) => void;
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
  commentCount = 0,
  priority = false,
  eager = false,
}: ProjectCardProps) => {
  const isPublished = project.status === 'published';
  const shouldLoadEagerly = priority || eager;
  const likesCount = formatEngagementCount(project.likes);
  const commentsCount = formatEngagementCount(commentCount);
  const sharesCount = formatEngagementCount(project.shares);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300">
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
            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-violet-600 focus:ring-violet-500"
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
          </div>
          <div className="mb-2 flex items-center gap-3">
            <p className="text-sm font-medium text-violet-600">
              {project.client} • {project.year}
            </p>
            <div className="flex items-center gap-1.5 opacity-85">
              {project.software?.slice(0, 3).map((s) => (
                <div key={s} title={s.replace('_', ' ')} className="h-5 w-5 flex-shrink-0">
                  {getIconMap('w-full h-full !text-[8px] !font-bold tracking-normal !rounded-sm')[
                    s.toLowerCase()
                  ] || (
                    <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-[7px] font-bold uppercase text-gray-500">
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
          className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
          aria-label={`Engagement: ${likesCount} likes, ${commentsCount} comments, ${sharesCount} shares`}
        >
          <div className="flex min-w-0 items-center justify-center gap-1.5 text-gray-500">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span className="min-w-0 font-mono text-[11px] font-semibold leading-none">
              {likesCount}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-1.5 text-gray-500">
            <MessageCircle className="h-3.5 w-3.5 text-violet-500" />
            <span className="min-w-0 font-mono text-[11px] font-semibold leading-none">
              {commentsCount}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-center gap-1.5 text-gray-500">
            <Share2 className="h-3.5 w-3.5 text-sky-500" />
            <span className="min-w-0 font-mono text-[11px] font-semibold leading-none">
              {sharesCount}
            </span>
          </div>
        </div>

        <div
          className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditingProject(project)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:text-violet-600"
            title="Edit Project"
            style={{ minWidth: 'unset', minHeight: 'unset' }}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteProject(project.id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:text-red-600"
            title="Delete Project"
            style={{ minWidth: 'unset', minHeight: 'unset' }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <StatusToggle
            isActive={isPublished}
            onClick={() => handleToggleProjectStatus(project)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
            iconActive={<Eye className="h-4 w-4" />}
            iconInactive={<EyeOff className="h-4 w-4" />}
            title={isPublished ? 'Change to Draft' : 'Publish Project'}
            variant="clean"
            style={{ minWidth: 'unset', minHeight: 'unset' }}
          />
        </div>
      </div>
    </div>
  );
};
