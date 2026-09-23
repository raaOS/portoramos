'use client';

import React from 'react';
import type { Project } from '@/types/projects';

interface ProjectBadgesProps {
  project: Pick<Project, 'client' | 'year'>;
}

export function ProjectBadges({ project }: ProjectBadgesProps) {
  if (!project.client && !project.year) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
      {project.client && (
        <span className="inline-flex h-5 items-center rounded-full bg-gray-100 px-3 text-xs leading-none text-gray-600 transition-colors duration-300 dark:bg-gray-800 dark:text-gray-400">
          {project.client}
        </span>
      )}
      {project.year && (
        <span className="inline-flex h-5 items-center rounded-full bg-gray-100 px-3 text-xs leading-none text-gray-600 transition-colors duration-300 dark:bg-gray-800 dark:text-gray-400">
          {project.year}
        </span>
      )}
    </div>
  );
}
