'use client';

import { useMemo } from 'react';
import type { Project } from '@/types/projects';
import { getIconMap } from '@/constants/skillIcons';

interface ProjectMetaProps {
    project: Project;
    translations: Record<string, string> | null;
    isWindowMode?: boolean;
}

export function ProjectMeta({ project, translations, isWindowMode: _isWindowMode }: ProjectMetaProps) {
    // Memoize icon map to prevent recreation on every render
    // MUST be called before any early return (Rules of Hooks)
    const iconMap = useMemo(() => getIconMap('w-5 h-5'), []);

    const hasMeta = project.role || project.timeline || project.team || (project.software && project.software.length > 0);

    if (!hasMeta) return null;

    return (
        <div className="mb-6">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:gap-x-12 gap-y-6 pt-5 pb-2 border-t border-gray-100 dark:border-gray-800">
                {/* Role */}
                {project.role && (
                    <div>
                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                            {translations ? 'Role' : 'Peran'}
                        </h3>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {translations?.role || project.role}
                        </p>
                    </div>
                )}

                {/* Software Icons */}
                {project.software && project.software.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Software</h3>
                        <div className="flex items-center gap-2">
                            {project.software.map(s => (
                                <SoftwareIcon key={s} name={s} iconMap={iconMap} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {project.timeline && (
                    <div>
                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                            {translations ? 'Timeline' : 'Waktu'}
                        </h3>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {translations?.timeline || project.timeline}
                        </p>
                    </div>
                )}

                {/* Team */}
                {project.team && (
                    <div>
                        <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                            {translations ? 'Team' : 'Tim'}
                        </h3>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {translations?.team || project.team}
                        </p>
                    </div>
                )}

                {/* Type */}
                <div>
                    <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                        {translations ? 'Type' : 'Tipe'}
                    </h3>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {translations
                            ? (project.type === 'commercial' ? 'Commercial Project' : 'Visual Art')
                            : (project.type === 'commercial' ? 'Project Komersial' : 'Karya Visual')
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}

// Separate component for software icon to prevent unnecessary re-renders
function SoftwareIcon({ name, iconMap }: { name: string; iconMap: Record<string, React.ReactNode> }) {
    const icon = iconMap[name.toLowerCase()];

    if (icon) {
        return <div title={name.replace('_', ' ')}>{icon}</div>;
    }

    return (
        <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
            {name.slice(0, 2)}
        </div>
    );
}
