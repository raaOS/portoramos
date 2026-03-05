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
        <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {translations?.title || project.title}
            </h1>
            {isWindowMode && (
                <a
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:opacity-100 opacity-60 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-all text-xs font-semibold tracking-wide group whitespace-nowrap shrink-0"
                    title="Open Full Page"
                >
                    <span>Open Page</span>
                    <ExternalLink size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
            )}
        </div>
    );
}
