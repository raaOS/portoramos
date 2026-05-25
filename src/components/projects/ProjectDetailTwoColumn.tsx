'use client';

import { useMemo, useCallback, useSyncExternalStore } from 'react';
import type { Project, GalleryItem } from '@/types/projects';
import { motion } from 'motion/react';
import LightboxGallery from '@/components/ui/LightboxGallery';
import { useProjectDetail } from './project-detail/hooks';
import {
  ProjectBackButton,
  ProjectCover,
  ProjectHeader,
  ProjectMeta,
  ProjectNarrative,
  ProjectGallery,
  ProjectInteractionBar,
  ProjectRelatedColumn,
  ProjectComments,
  useInfiniteProjects,
} from './project-detail/components';

interface ProjectDetailTwoColumnProps {
  project: Project;
  cover: GalleryItem;
  gallery: GalleryItem[];
  ratio: number;
  otherProjects: Project[];
  isWindowMode?: boolean;
}

export default function ProjectDetailTwoColumn({
  project,
  cover,
  gallery,
  ratio,
  otherProjects,
  isWindowMode = false,
}: ProjectDetailTwoColumnProps) {
  // SSR-safe mount detection without triggering set-state-in-effect lint
  const subscribe = useCallback(() => () => {}, []);
  const hasMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const {
    comments,
    setComments,
    isProjectLiked,
    metrics,
    translations,
    translateLoading,
    activeGalleryGroup,
    setActiveGalleryGroup,
    activeNarrativeTab,
    setActiveNarrativeTab,
    handleProjectLike,
    handleProjectShare,
    translateAll,
  } = useProjectDetail({ project });

  const handleScrollToComments = useCallback(() => {
    setTimeout(() => {
      document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Memoize container class to prevent recreation
  const containerClassName = useMemo(() => {
    return isWindowMode
      ? 'h-full overflow-y-auto p-3 sm:p-4 lg:p-6'
      : 'min-h-screen pt-10 sm:pt-12 px-3 sm:px-4 lg:px-6 pb-8';
  }, [isWindowMode]);

  // Infinity Scroll Logic
  const { displayedProjects, isLoading, observerTarget } = useInfiniteProjects(otherProjects);

  // Memoize column projects to prevent array recreation
  // FIX (Point 2): Use Even/Odd distribution instead of slice to prevent layout jumps
  const columnAProjects = useMemo(() => {
    if (isWindowMode) return [];
    return displayedProjects.filter((_, idx) => idx % 2 !== 0);
  }, [displayedProjects, isWindowMode]);

  const columnBProjects = useMemo(() => {
    if (isWindowMode) return [];
    return displayedProjects.filter((_, idx) => idx % 2 === 0);
  }, [displayedProjects, isWindowMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${containerClassName} bg-white transition-colors duration-300 dark:bg-black`}
    >
      {/* Back Button */}
      {!isWindowMode && <ProjectBackButton />}

      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* Left Column */}
        <div className={isWindowMode ? 'w-full' : 'space-y-3 sm:space-y-4 lg:w-1/2'}>
          <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-none transition-all duration-300 dark:border-white/10 dark:bg-black sm:rounded-xl">
            <div className="flex h-full flex-col lg:flex-row">
              {/* Cover & Interaction Section */}
              <div className="w-full border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-gray-900/20 lg:w-[45%] lg:border-b-0 lg:border-r">
                <ProjectCover
                  project={project}
                  cover={cover}
                  ratio={ratio}
                  isWindowMode={isWindowMode}
                />

                <div className="mt-6 space-y-6 px-6 pb-10 sm:mt-8 sm:space-y-8 lg:px-10">
                  {/* Interaction Bar */}
                  <ProjectInteractionBar
                    isProjectLiked={isProjectLiked}
                    metrics={metrics}
                    comments={comments}
                    translations={translations}
                    translateLoading={translateLoading}
                    onLike={handleProjectLike}
                    onShare={handleProjectShare}
                    onTranslate={translateAll}
                    onScrollToComments={handleScrollToComments}
                    client={project.client}
                    year={project.year}
                  />

                  {/* Comments Section */}
                  <ProjectComments
                    slug={project.slug}
                    comments={comments}
                    setComments={setComments}
                    allowComments={project.allowComments}
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className="flex w-full flex-col lg:w-[55%]">
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Header */}
                  <ProjectHeader
                    project={project}
                    translations={translations}
                    isWindowMode={isWindowMode}
                  />

                  {/* Meta Info */}
                  <ProjectMeta
                    project={project}
                    translations={translations}
                    isWindowMode={isWindowMode}
                  />

                  {/* Narrative Tabs */}
                  <ProjectNarrative
                    project={project}
                    translations={translations}
                    activeTab={activeNarrativeTab}
                    onTabChange={setActiveNarrativeTab}
                  />

                  {/* Gallery */}
                  <ProjectGallery
                    project={project}
                    gallery={gallery}
                    onGroupClick={setActiveGalleryGroup}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Related Projects - Column A (Only for non-window mode) */}
          {!isWindowMode && hasMounted && columnAProjects.length > 0 && (
            <ProjectRelatedColumn
              projects={columnAProjects}
              column="A"
              // FIX (Point 3): Pass a base index offset if needed,
              // but ProjectRelatedColumn internally handles keys.
              // We will update ProjectRelatedColumn next.
            />
          )}
        </div>

        {/* Right Column - Related Projects */}
        {!isWindowMode && hasMounted && columnBProjects.length > 0 && (
          <ProjectRelatedColumn projects={columnBProjects} column="B" />
        )}
      </div>

      {/* Infinity Scroll Target & Loading UI */}
      {!isWindowMode && (
        <div className="mt-10 pb-20">
          <div
            ref={observerTarget}
            className="pointer-events-none h-20 w-full"
            aria-hidden="true"
          />

          {isLoading && (
            <div className="text-center opacity-50">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-amber-500"></div>
              <p className="mt-3 whitespace-nowrap text-xs font-medium text-gray-500">
                Memuat karya...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {activeGalleryGroup && (
        <LightboxGallery
          items={activeGalleryGroup.items}
          groupName={activeGalleryGroup.name}
          onClose={() => setActiveGalleryGroup(null)}
        />
      )}
    </motion.div>
  );
}

// Re-export hooks and components for external use
export { useProjectDetail } from './project-detail/hooks';
export * from './project-detail/components';
