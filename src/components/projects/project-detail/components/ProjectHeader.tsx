'use client';

import type { Project } from '@/types/projects';
import { ExternalLink } from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
  translations: Record<string, string> | null;
  isWindowMode?: boolean;
}

export function ProjectHeader({ project, translations, isWindowMode }: ProjectHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <h1 className="font-serif text-xl font-bold text-gray-900 transition-colors duration-300 dark:text-white sm:text-2xl lg:text-3xl">
        {translations?.title || project.title}
      </h1>
      {isWindowMode && (
        <a
          href={`/projects/${project.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold tracking-wide text-gray-400 opacity-60 transition-all hover:text-black hover:opacity-100 dark:text-gray-500 dark:hover:text-white"
          title="Open Full Page"
        >
          <span>Open Page</span>
          <ExternalLink
            size={14}
            className="opacity-70 transition-opacity group-hover:opacity-100"
          />
        </a>
      )}
    </div>
  );
}
