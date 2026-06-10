'use client';

import { useMemo } from 'react';
import type { Project } from '@/types/projects';
import { getIconMap } from '@/constants/skillIcons';
import { getTranslation } from '../utils/translations';

interface ProjectMetaProps {
  project: Project;
  translations: Record<string, string> | null;
  isWindowMode?: boolean;
}

export function ProjectMeta({ project, translations, isWindowMode = false }: ProjectMetaProps) {
  // Memoize icon map to prevent recreation on every render
  // MUST be called before any early return (Rules of Hooks)
  const iconMap = useMemo(() => getIconMap('w-5 h-5'), []);

  const hasMeta =
    project.role ||
    project.timeline ||
    project.team ||
    (project.software && project.software.length > 0);

  if (!hasMeta) return null;

  if (isWindowMode) {
    return (
      <div className="mb-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {project.role && (
            <MetaItem label={translations ? 'Role' : 'Peran'}>
              {getTranslation(translations, 'role') || project.role}
            </MetaItem>
          )}

          {project.software && project.software.length > 0 && (
            <MetaItem label="Software">
              <div className="flex items-center gap-2">
                {project.software.map((s) => (
                  <SoftwareIcon key={s} name={s} iconMap={iconMap} />
                ))}
              </div>
            </MetaItem>
          )}

          {project.timeline && (
            <MetaItem label={translations ? 'Timeline' : 'Waktu'}>
              {getTranslation(translations, 'timeline') || project.timeline}
            </MetaItem>
          )}

          {project.team && (
            <MetaItem label={translations ? 'Team' : 'Tim'}>
              {getTranslation(translations, 'team') || project.team}
            </MetaItem>
          )}

          <MetaItem label={translations ? 'Type' : 'Tipe'}>
            {translations
              ? project.type === 'commercial'
                ? 'Commercial Project'
                : 'Visual Art'
              : project.type === 'commercial'
                ? 'Project Komersial'
                : 'Karya Visual'}
          </MetaItem>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-y-6 border-t border-gray-100 pb-2 pt-5 dark:border-gray-800 sm:flex sm:flex-wrap sm:gap-x-12">
        {/* Role */}
        {project.role && (
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {translations ? 'Role' : 'Peran'}
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getTranslation(translations, 'role') || project.role}
            </p>
          </div>
        )}

        {/* Software Icons */}
        {project.software && project.software.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Software
            </h3>
            <div className="flex items-center gap-2">
              {project.software.map((s) => (
                <SoftwareIcon key={s} name={s} iconMap={iconMap} />
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {project.timeline && (
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {translations ? 'Timeline' : 'Waktu'}
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getTranslation(translations, 'timeline') || project.timeline}
            </p>
          </div>
        )}

        {/* Team */}
        {project.team && (
          <div>
            <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {translations ? 'Team' : 'Tim'}
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {getTranslation(translations, 'team') || project.team}
            </p>
          </div>
        )}

        {/* Type */}
        <div>
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {translations ? 'Type' : 'Tipe'}
          </h3>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {translations
              ? project.type === 'commercial'
                ? 'Commercial Project'
                : 'Visual Art'
              : project.type === 'commercial'
                ? 'Project Komersial'
                : 'Karya Visual'}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </h3>
      <div className="truncate text-[13px] font-medium leading-5 text-gray-900 dark:text-white">
        {children}
      </div>
    </div>
  );
}

// Separate component for software icon to prevent unnecessary re-renders
function SoftwareIcon({
  name,
  iconMap,
}: {
  name: string;
  iconMap: Record<string, React.ReactNode>;
}) {
  const icon = iconMap[name.toLowerCase()];

  if (icon) {
    return <div title={name.replace('_', ' ')}>{icon}</div>;
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-200 text-[8px] font-bold uppercase text-gray-500">
      {name.slice(0, 2)}
    </div>
  );
}
