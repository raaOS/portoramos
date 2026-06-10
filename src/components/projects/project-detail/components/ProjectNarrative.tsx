'use client';

import type { Project } from '@/types/projects';
import ReadMoreDescription from '@/components/ui/ReadMoreDescription';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../utils/translations';

interface ProjectNarrativeProps {
  project: Project;
  translations: Record<string, string> | null;
  activeTab: 'description' | 'challenge' | 'solution' | 'impact';
  onTabChange: (tab: 'description' | 'challenge' | 'solution' | 'impact') => void;
}

export function ProjectNarrative({
  project,
  translations,
  activeTab,
  onTabChange,
}: ProjectNarrativeProps) {
  const hasNarrative = !!project.narrative;
  const hasDescription = !!project.description;
  const hasChallenge = !!(project.narrative?.challenge || project.narrative?.concept);
  const hasSolution = !!(project.narrative?.solution || project.narrative?.process);
  const hasImpact = !!(
    project.narrative?.impact ||
    project.narrative?.result ||
    project.narrative?.detail
  );

  const tabs = useMemo(() => {
    const result: Array<{
      id: 'description' | 'challenge' | 'solution' | 'impact';
      label: string;
      show: boolean;
    }> = [
      { id: 'description', label: translations ? 'About' : 'Tentang', show: hasDescription },
      {
        id: 'challenge',
        label: translations
          ? project.narrative?.concept
            ? 'Concept'
            : 'Challenge'
          : project.narrative?.concept
            ? 'Konsep'
            : 'Tantangan',
        show: hasChallenge,
      },
      {
        id: 'solution',
        label: translations
          ? project.narrative?.process
            ? 'Process'
            : 'Solution'
          : project.narrative?.process
            ? 'Proses'
            : 'Solusi',
        show: hasSolution,
      },
      {
        id: 'impact',
        label: translations
          ? project.narrative?.impact
            ? 'Impact'
            : project.narrative?.detail
              ? 'Detail'
              : 'Result'
          : project.narrative?.impact
            ? 'Dampak'
            : project.narrative?.detail
              ? 'Detail'
              : 'Hasil',
        show: hasImpact,
      },
    ];
    return result.filter((t) => t.show);
  }, [translations, project.narrative, hasDescription, hasChallenge, hasSolution, hasImpact]);

  const tabStyles: Record<string, { bg: string; tint: string; border: string }> = {
    description: {
      bg: 'bg-indigo-600 dark:bg-indigo-500',
      tint: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      border: 'border-black/10 dark:border-white/10',
    },
    challenge: {
      bg: 'bg-rose-600 dark:bg-rose-500',
      tint: 'bg-rose-50/50 dark:bg-rose-950/20',
      border: 'border-black/10 dark:border-white/10',
    },
    solution: {
      bg: 'bg-amber-500 dark:bg-amber-400',
      tint: 'bg-amber-50/60 dark:bg-amber-950/20',
      border: 'border-black/10 dark:border-white/10',
    },
    impact: {
      bg: 'bg-emerald-600 dark:bg-emerald-500',
      tint: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-black/10 dark:border-white/10',
    },
  };

  const currentStyle = tabStyles[activeTab];

  if (!hasNarrative && !hasDescription) return null;

  return (
    <div className="mb-8 mt-12 font-sans">
      {/* React-Tabs Style Container */}
      <div className="react-tabs-container">
        {/* Tab List Base Line - Consolidated to prevent flickering */}
        <div className="relative z-10 w-full border-b border-black/10 dark:border-white/10">
          <div className="relative flex items-end px-0">
            {/* Animated Pill — single persistent element, moves via layout animation */}
            <motion.div
              className={`absolute -bottom-px z-10 h-full rounded-t-md ${tabStyles[activeTab].bg}`}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{
                left: `${(tabs.findIndex((t) => t.id === activeTab) / tabs.length) * 100}%`,
                width: `${100 / tabs.length}%`,
              }}
            />

            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative -mb-[1px] flex flex-1 items-center justify-center px-5 py-1.5 text-sm font-bold outline-none transition-colors duration-150 sm:px-8 ${
                    isActive ? 'z-20 text-white' : 'z-0 text-gray-400 hover:text-gray-600'
                  } ${idx === 0 ? 'ml-0' : ''} `}
                >
                  <span className="relative z-10 text-center">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panel / Content Area - Stable Height to prevent jumping */}
        <div
          className={`border-x border-b border-black/10 dark:border-white/10 ${currentStyle.border} min-h-[220px] rounded-b-md px-6 py-8 sm:px-10 sm:py-10 ${currentStyle.tint} relative z-0 w-full overflow-hidden bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:bg-gray-950`}
        >
          <div className="relative z-10">
            <TabContent activeTab={activeTab} project={project} translations={translations} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabContent({
  activeTab,
  project,
  translations,
}: {
  activeTab: string;
  project: Project;
  translations: Record<string, string> | null;
}) {
  const narrative = project.narrative;

  switch (activeTab) {
    case 'description':
      return (
        <div className="space-y-4">
          <ReadMoreDescription
            text={getTranslation(translations, 'description') || project.description || ''}
            maxLines={12}
            className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base"
          />
        </div>
      );

    case 'challenge':
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">
            {getTranslation(
              translations,
              narrative?.challenge && 'narrative.challenge',
              narrative?.concept && 'narrative.concept',
              'challenge'
            ) ||
              narrative?.challenge ||
              narrative?.concept}
          </p>
        </div>
      );

    case 'solution':
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">
            {getTranslation(
              translations,
              narrative?.solution && 'narrative.solution',
              narrative?.process && 'narrative.process',
              'solution'
            ) ||
              narrative?.solution ||
              narrative?.process}
          </p>
        </div>
      );

    case 'impact':
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">
            {getTranslation(
              translations,
              narrative?.impact && 'narrative.impact',
              narrative?.result && 'narrative.result',
              narrative?.detail && 'narrative.detail',
              'impact'
            ) ||
              narrative?.impact ||
              narrative?.result ||
              narrative?.detail}
          </p>
        </div>
      );

    default:
      return null;
  }
}
