'use client';

import type { Project } from '@/types/projects';

interface ProjectHeaderProps {
  project: Project;
  translations: Record<string, string> | null;
  isWindowMode?: boolean;
}

export function ProjectHeader({ project, translations }: ProjectHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="font-serif text-xl font-bold text-gray-900 transition-colors duration-300 dark:text-white sm:text-2xl lg:text-3xl">
        {translations?.title || project.title}
      </h1>
    </div>
  );
}
