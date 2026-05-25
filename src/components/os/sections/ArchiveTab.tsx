import React from 'react';
import { getProxiedUrl } from '@/lib/utils';
import Image from 'next/image';
import type { Project } from '@/types/projects';
import Media from '@/components/shared/Media';
import { resolvePreviewCover } from '@/lib/images';

interface ArchiveTabProps {
  archiveProjects: Project[];
}

export const ArchiveTab = ({ archiveProjects }: ArchiveTabProps) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
    <div>
      <h1 className="mb-2 text-2xl font-bold text-black">Archive</h1>
      <p className="text-sm text-gray-600">
        Experimental works, visual art, and personal explorations. These projects showcase style
        range outside of commercial constraints.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {archiveProjects.map((project) => {
        const cover = resolvePreviewCover(project);

        return (
          <div
            key={project.id}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
          >
            {project.type === 'visual_art' && (
              <div className="absolute right-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                Art
              </div>
            )}
            {cover.kind === 'video' ? (
              <Media
                kind="video"
                src={cover.src}
                poster={cover.poster}
                alt={project.title}
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                autoplay
                muted
                loop
                playsInline
                lazy
              />
            ) : (
              <Image
                src={getProxiedUrl(project.cover)}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
            )}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
              <h3 className="truncate text-sm font-bold text-white">{project.title}</h3>
              <p className="truncate text-xs text-white/70">{project.tags.join(', ')}</p>
            </div>
          </div>
        );
      })}
      {archiveProjects.length === 0 && (
        <p className="col-span-2 py-8 text-center italic text-gray-400">
          No archived projects found.
        </p>
      )}
    </div>
  </div>
);
