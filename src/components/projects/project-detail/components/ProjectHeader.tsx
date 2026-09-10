'use client';

import type { Project } from '@/types/projects';
import { getTranslation } from '../utils/translations';

interface ProjectHeaderProps {
  project: Project;
  translations: Record<string, string> | null;
  isWindowMode?: boolean;
}

export function ProjectHeader({ project, translations }: ProjectHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="font-serif text-xl font-bold text-gray-900 transition-colors duration-300 dark:text-white sm:text-2xl lg:text-3xl">
        {getTranslation(translations, 'title') || project.title}
      </h1>
    </div>
  );
}
