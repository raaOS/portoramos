'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import type { GalleryGroup, GalleryItem, Project } from '@/types/projects';
import { getTranslation, type ProjectTranslations } from '../utils/translations';
import { ProjectGallery } from './ProjectGallery';
import { ProjectMeta } from './ProjectMeta';
import { ProjectNarrative } from './ProjectNarrative';

export type ProjectWindowTabId = 'overview' | 'story' | 'gallery';

export interface ProjectWindowTab {
  id: ProjectWindowTabId;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface ProjectDetailTabsPaneProps {
  project: Project;
  gallery: GalleryItem[];
  translations: ProjectTranslations | null;
  isEnglish: boolean;
  isWindowMode: boolean;
  tabs: ProjectWindowTab[];
  activeTab: ProjectWindowTabId;
  onTabChange: (tab: ProjectWindowTabId) => void;
  projectBadges: ReactNode;
  activeNarrativeTab: 'challenge' | 'solution' | 'impact';
  onNarrativeTabChange: (tab: 'challenge' | 'solution' | 'impact') => void;
  onGalleryGroupClick: (group: GalleryGroup) => void;
}

export default function ProjectDetailTabsPane({
  project,
  gallery,
  translations,
  isEnglish,
  isWindowMode,
  tabs,
  activeTab,
  onTabChange,
  projectBadges,
  activeNarrativeTab,
  onNarrativeTabChange,
  onGalleryGroupClick,
}: ProjectDetailTabsPaneProps) {
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === selectedTab)
  );

  const navClassName = isWindowMode
    ? 'flex-shrink-0 border-b border-black/5 bg-gray-50/30 px-5 py-3 dark:border-white/5 dark:bg-gray-900/5 sm:px-6'
    : 'border-b border-black/5 bg-gray-50/30 px-5 py-3 dark:border-white/5 dark:bg-gray-900/5 sm:px-6';
  const contentClassName = isWindowMode
    ? 'h-auto overflow-visible p-5 sm:p-6 md:h-0 md:flex-1 md:flex-grow md:overflow-y-auto'
    : 'p-5 sm:p-6 lg:p-8';
  const motionY = isWindowMode ? 24 : 12;
  const motionExitY = isWindowMode ? -12 : -6;

  return (
    <>
      <div className={navClassName}>
        <div className="relative flex gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-gray-900/60">
          <motion.div
            className="absolute inset-y-1 z-0 rounded-lg bg-white shadow-sm dark:bg-gray-800"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            animate={{
              left: `calc(${(selectedIndex / tabs.length) * 100}% + 4px)`,
              width: `calc(${100 / tabs.length}% - ${tabs.length > 1 ? '4px' : '8px'})`,
            }}
          />
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold outline-none transition-colors duration-200 ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <span className="flex items-center gap-1.5 text-center">
                  <Icon
                    size={14}
                    className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={contentClassName}>
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: motionY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: motionExitY }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-6"
            >
              {projectBadges}
              <ProjectMeta project={project} translations={translations} isWindowMode={isWindowMode} />

              <div className="border-t border-black/5 pt-4 dark:border-white/5">
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {isEnglish ? 'About Project' : 'Tentang Proyek'}
                </h4>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {getTranslation(translations, 'description') || project.description}
                </p>
              </div>
            </motion.div>
          )}

          {selectedTab === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: motionY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: motionExitY }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="story-tab-container -mt-8"
            >
              <ProjectNarrative
                project={project}
                translations={translations}
                activeTab={activeNarrativeTab}
                onTabChange={onNarrativeTabChange}
                isWindowMode={isWindowMode}
              />
            </motion.div>
          )}

          {selectedTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: motionY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: motionExitY }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="space-y-4"
            >
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                {isEnglish ? 'Project Gallery' : 'Galeri Proyek'}
              </h4>
              <ProjectGallery
                project={project}
                gallery={gallery}
                onGroupClick={onGalleryGroupClick}
                isWindowMode={isWindowMode}
                translations={translations}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
