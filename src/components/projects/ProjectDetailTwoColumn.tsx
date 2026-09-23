'use client';

import { useMemo, useCallback, useState, useEffect, useSyncExternalStore } from 'react';
import type { Project, GalleryItem } from '@/types/projects';
import { motion } from 'motion/react';
import { Info, BookOpen, Image } from 'lucide-react';
import LightboxGallery from '@/components/ui/LightboxGallery';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeProject } from '@/lib/i18n/contentLocalization';
import { useProjectDetail } from './project-detail/hooks';
import {
  ProjectBackButton,
  ProjectHeader,
  ProjectRelatedColumn,
  ProjectMediaColumn,
  ProjectBadges,
  ProjectInfiniteScrollLoader,
  ProjectWindowSplitView,
  useInfiniteProjects,
} from './project-detail/components';
import ProjectDetailTabsPane, {
  type ProjectWindowTab,
  type ProjectWindowTabId,
} from './project-detail/components/ProjectDetailTabsPane';

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
  const { locale } = useLanguage();
  const localizedProject = useMemo(() => localizeProject(project, locale), [locale, project]);

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
    isLikePending,
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
  const displayProject = translations ? project : localizedProject;
  const isEnglish = locale === 'en' || !!translations;

  const [activeWindowTab, setActiveWindowTab] = useState<ProjectWindowTabId>('overview');
  const [isLeftColumnHovered, setIsLeftColumnHovered] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const commentsSectionId = useMemo(() => `comments-section-${project.id}`, [project.id]);

  const handleScrollToComments = useCallback(() => {
    setIsCommentsOpen((prev) => !prev);
  }, []);

  const containerClassName = useMemo(() => {
    return isWindowMode
      ? 'h-full overflow-y-auto p-3 sm:p-4 lg:p-6'
      : 'min-h-screen pt-10 sm:pt-12 px-3 sm:px-4 lg:px-6 pb-8';
  }, [isWindowMode]);

  // Infinity Scroll Logic
  const { displayedProjects, isLoading, observerTarget } = useInfiniteProjects(otherProjects);

  const columnAProjects = useMemo(() => {
    if (isWindowMode) return [];
    return displayedProjects.filter((_, idx) => idx % 2 !== 0);
  }, [displayedProjects, isWindowMode]);

  const columnBProjects = useMemo(() => {
    if (isWindowMode) return [];
    return displayedProjects.filter((_, idx) => idx % 2 === 0);
  }, [displayedProjects, isWindowMode]);

  const projectBadges = <ProjectBadges project={project} />;

  const hasGroupedGallery = project.galleryGroups && project.galleryGroups.length > 0;
  const totalGalleryCount =
    gallery.length + (project.galleryGroups?.reduce((acc, g) => acc + g.items.length, 0) || 0);

  const windowTabs = useMemo<ProjectWindowTab[]>(() => {
    return [
      {
        id: 'overview' as const,
        label: isEnglish ? 'Overview' : 'Ringkasan',
        icon: Info,
        show: true,
      },
      {
        id: 'story' as const,
        label: isEnglish ? 'Story' : 'Proses',
        icon: BookOpen,
        show: !!displayProject.narrative,
      },
      {
        id: 'gallery' as const,
        label: isEnglish ? 'Gallery' : 'Galeri',
        icon: Image,
        show: gallery.length > 0 || hasGroupedGallery,
        count: totalGalleryCount,
      },
    ]
      .filter((tab) => tab.show)
      .map(({ show: _show, ...tab }) => tab);
  }, [displayProject.narrative, gallery.length, hasGroupedGallery, isEnglish, totalGalleryCount]);

  if (isWindowMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-full w-full"
      >
        <ProjectWindowSplitView
          project={project}
          displayProject={displayProject}
          cover={cover}
          gallery={gallery}
          ratio={ratio}
          isMobile={isMobile}
          isLeftColumnHovered={isLeftColumnHovered}
          setIsLeftColumnHovered={setIsLeftColumnHovered}
          isCommentsOpen={isCommentsOpen}
          setIsCommentsOpen={setIsCommentsOpen}
          isEnglish={isEnglish}
          isProjectLiked={isProjectLiked}
          metrics={metrics}
          comments={comments}
          setComments={setComments}
          translations={translations}
          translateLoading={translateLoading}
          isLikePending={isLikePending}
          handleProjectLike={handleProjectLike}
          handleProjectShare={handleProjectShare}
          translateAll={translateAll}
          handleScrollToComments={handleScrollToComments}
          commentsSectionId={commentsSectionId}
          windowTabs={windowTabs}
          activeWindowTab={activeWindowTab}
          setActiveWindowTab={setActiveWindowTab}
          projectBadges={projectBadges}
          activeNarrativeTab={activeNarrativeTab}
          setActiveNarrativeTab={setActiveNarrativeTab}
          setActiveGalleryGroup={setActiveGalleryGroup}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${containerClassName} bg-white transition-colors duration-300 dark:bg-black`}
    >
      <ProjectBackButton />

      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* Left Column */}
        <div className="space-y-3 sm:space-y-4 lg:w-1/2">
          {/* Card Box */}
          <div className="relative overflow-hidden rounded-lg border border-black/10 bg-white shadow-none transition-all duration-300 dark:border-white/10 dark:bg-black sm:rounded-xl">
            <div className="flex h-full flex-col lg:flex-row">
              {/* Cover & Interaction Section */}
              <ProjectMediaColumn
                project={project}
                displayProject={displayProject}
                cover={cover}
                ratio={ratio}
                isWindowMode={false}
                isMobile={isMobile}
                isLeftColumnHovered={isLeftColumnHovered}
                setIsLeftColumnHovered={setIsLeftColumnHovered}
                isCommentsOpen={isCommentsOpen}
                setIsCommentsOpen={setIsCommentsOpen}
                isEnglish={isEnglish}
                isProjectLiked={isProjectLiked}
                metrics={metrics}
                comments={comments}
                setComments={setComments}
                translations={translations}
                translateLoading={translateLoading}
                isLikePending={isLikePending}
                handleProjectLike={handleProjectLike}
                handleProjectShare={handleProjectShare}
                translateAll={translateAll}
                handleScrollToComments={handleScrollToComments}
                commentsSectionId={commentsSectionId}
                className="relative flex w-full items-center justify-center overflow-hidden border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-gray-900/20 lg:w-[45%] lg:border-b-0 lg:border-r cursor-pointer lg:cursor-default"
                keyPrefix="standalone-"
              />

              {/* Details Section */}
              <div className="flex w-full flex-col bg-white dark:bg-black lg:w-[55%]">
                <div className="border-b border-black/5 p-5 dark:border-white/5 sm:p-6">
                  <ProjectHeader
                    project={displayProject}
                    translations={translations}
                    isWindowMode={false}
                  />
                </div>

                <ProjectDetailTabsPane
                  project={displayProject}
                  gallery={gallery}
                  translations={translations}
                  isEnglish={isEnglish}
                  isWindowMode={false}
                  tabs={windowTabs}
                  activeTab={activeWindowTab}
                  onTabChange={setActiveWindowTab}
                  projectBadges={projectBadges}
                  activeNarrativeTab={activeNarrativeTab}
                  onNarrativeTabChange={setActiveNarrativeTab}
                  onGalleryGroupClick={setActiveGalleryGroup}
                />
              </div>
            </div>
          </div>

          {/* Related Projects - Column A */}
          {hasMounted && columnAProjects.length > 0 && (
            <ProjectRelatedColumn projects={columnAProjects} column="A" />
          )}
        </div>

        {/* Right Column - Related Projects */}
        {hasMounted && columnBProjects.length > 0 && (
          <ProjectRelatedColumn projects={columnBProjects} column="B" />
        )}
      </div>

      {/* Infinity Scroll Target & Loading UI */}
      <ProjectInfiniteScrollLoader
        observerTarget={observerTarget}
        isLoading={isLoading}
        locale={locale}
      />

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

export { useProjectDetail } from './project-detail/hooks';
export * from './project-detail/components';
