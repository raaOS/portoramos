'use client';

import type { Project } from '@/types/projects';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { getTranslation } from '../utils/translations';

interface ProjectNarrativeProps {
  project: Project;
  translations: Record<string, string> | null;
  activeTab: 'challenge' | 'solution' | 'impact';
  onTabChange: (tab: 'challenge' | 'solution' | 'impact') => void;
  isWindowMode?: boolean;
}

export function ProjectNarrative({
  project,
  translations,
  activeTab,
  onTabChange,
  isWindowMode = false,
}: ProjectNarrativeProps) {
  const hasChallenge = !!(project.narrative?.challenge || project.narrative?.concept);
  const hasSolution = !!(project.narrative?.solution || project.narrative?.process);
  const hasImpact = !!(
    project.narrative?.impact ||
    project.narrative?.result ||
    project.narrative?.detail
  );
  const hasNarrativeContent = hasChallenge || hasSolution || hasImpact;

  const tabs = useMemo(() => {
    const result: Array<{
      id: 'challenge' | 'solution' | 'impact';
      label: string;
      show: boolean;
    }> = [
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
  }, [translations, project.narrative, hasChallenge, hasSolution, hasImpact]);

  const tabStyles: Record<string, { bg: string; tint: string; border: string }> = {
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

  const activeTabIndex = useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [tabs, activeTab]);

  const currentTabId = useMemo(() => {
    const currentTab = tabs[activeTabIndex];
    return currentTab ? currentTab.id : 'challenge';
  }, [tabs, activeTabIndex]);

  const currentStyle = tabStyles[currentTabId];

  if (!hasNarrativeContent) return null;

  return (
    <div className="mb-8 mt-12 font-sans">
      {/* Curved Browser-Tabs Style Container */}
      <div className="react-tabs-container overflow-hidden rounded-[22px] border border-black/10 bg-white dark:border-white/10 dark:bg-gray-950">
        {/* Browser-style Tab Bar */}
        <div className="relative bg-gray-50/90 px-4 pt-2 dark:bg-gray-900/40">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px bg-black/10 dark:bg-white/10"
          />
          <div
            className="relative z-10 mr-auto flex h-11 min-w-0 items-end"
            style={{ width: `min(100%, ${tabs.length * 180}px)` }}
          >
            {/* Animated Curved Backdrop */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 z-[1] h-11"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              animate={{
                left: `${(activeTabIndex / tabs.length) * 100}%`,
                width: `${100 / tabs.length}%`,
              }}
            >
              <svg
                className="h-full w-full"
                viewBox="0 0 180 44"
                preserveAspectRatio="none"
                overflow="visible"
              >
                <path
                  className="fill-white dark:fill-gray-950"
                  d="M0 47H180V43C166 43 160 39 160 27V18C160 8 152 3 140 3H40C28 3 20 8 20 18V27C20 39 14 43 0 43V47Z"
                />
                <path
                  className="fill-none stroke-black/10 dark:stroke-white/10"
                  d="M0 43C14 43 20 39 20 27V18C20 8 28 3 40 3H140C152 3 160 8 160 18V27C160 39 166 43 180 43"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </motion.div>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const textActiveColor =
                tab.id === 'challenge'
                  ? 'text-rose-600 dark:text-rose-400'
                  : tab.id === 'solution'
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400';

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex h-11 min-w-0 flex-1 cursor-pointer appearance-none items-center justify-center gap-2 border-0 bg-transparent px-2 text-[11px] font-extrabold tracking-tight transition-colors duration-200 sm:px-[18px] ${
                    isActive
                      ? `z-20 ${textActiveColor}`
                      : 'z-10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="relative z-10 truncate text-center">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Panel / Content Area - Stable Height to prevent jumping */}
        <div
          className={`min-h-[220px] px-6 py-8 sm:px-10 sm:py-10 ${currentStyle.tint} relative z-0 w-full overflow-hidden bg-white dark:bg-gray-950 ${isWindowMode ? 'shadow-[0_4px_20px_rgba(0,0,0,0.02)]' : 'shadow-none'}`}
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
