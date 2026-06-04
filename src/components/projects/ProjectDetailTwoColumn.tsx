'use client';

import { useMemo, useCallback, useState, useSyncExternalStore } from 'react';
import type { Project, GalleryItem } from '@/types/projects';
import { motion, AnimatePresence } from 'motion/react';
import { Info, BookOpen, Image, MessageSquare } from 'lucide-react';
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
  const [activeWindowTab, setActiveWindowTab] = useState<'overview' | 'story' | 'gallery'>('overview');
  const [isLeftColumnHovered, setIsLeftColumnHovered] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const commentsSectionId = useMemo(() => `comments-section-${project.id}`, [project.id]);

  const handleScrollToComments = useCallback(() => {
    if (isWindowMode) {
      setIsCommentsOpen(prev => !prev);
      return;
    }

    setTimeout(() => {
      document.getElementById(commentsSectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [commentsSectionId, isWindowMode]);

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

  const projectBadges = (
    <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
      {project.client && (
        <span className="inline-flex h-5 items-center rounded-full bg-gray-100 px-3 text-xs leading-none text-gray-600 transition-colors duration-300 dark:bg-gray-800 dark:text-gray-400">
          {project.client}
        </span>
      )}
      {project.year && (
        <span className="inline-flex h-5 items-center rounded-full bg-gray-100 px-3 text-xs leading-none text-gray-600 transition-colors duration-300 dark:bg-gray-800 dark:text-gray-400">
          {project.year}
        </span>
      )}
    </div>
  );

  const renderEngagementPanel = (className = '', commentsWithDivider = true) => (
    <div className={className}>
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
      />

      {!isWindowMode && projectBadges}

      {/* Comments Section */}
      <ProjectComments
        slug={project.slug}
        comments={comments}
        setComments={setComments}
        allowComments={project.allowComments}
        sectionId={commentsSectionId}
        withDivider={commentsWithDivider}
        isVisible={!isWindowMode}
        animated={isWindowMode}
      />
    </div>
  );

  if (isWindowMode) {
    const windowTabs = [
      { id: 'overview' as const, label: translations ? 'Overview' : 'Ringkasan', icon: Info, show: true },
      { id: 'story' as const, label: translations ? 'Story' : 'Proses', icon: BookOpen, show: !!project.narrative },
      { id: 'gallery' as const, label: translations ? 'Gallery' : 'Galeri', icon: Image, show: gallery.length > 0, count: gallery.length },
    ].filter(t => t.show);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-white dark:bg-black transition-colors duration-300 select-text"
      >
        {/* Left Column: Media & Core Interaction */}
        <div 
          onMouseEnter={() => setIsLeftColumnHovered(true)}
          onMouseLeave={() => { setIsLeftColumnHovered(false); setIsCommentsOpen(false); }}
          className="relative w-full md:w-[42%] flex items-center justify-center border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/10 h-full overflow-hidden" 
          data-no-window-drag
        >
          {/* Cover + Icons wrapper — icons positioned relative to the media, not the column */}
          <div 
            className="relative w-full transition-[padding] duration-300 ease-out"
            style={{ padding: isLeftColumnHovered ? '0 24px' : '0' }}
          >
            <ProjectCover project={project} cover={cover} ratio={ratio} isWindowMode={true} />
            
            {/* Vertical Interaction Bar — centered vertically relative to image */}
            <motion.div 
              className="absolute right-1 inset-y-0 z-20 flex items-center"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: isLeftColumnHovered ? 0 : 50, opacity: isLeftColumnHovered ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
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
                orientation="vertical"
                projectSlug={project.slug}
              />
            </motion.div>
          </div>

          {/* Comments Overlay — slides up from bottom on comment icon click */}
          <AnimatePresence>
            {isCommentsOpen && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="absolute inset-0 z-30 flex flex-col bg-white/95 dark:bg-black/95 backdrop-blur-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {translations ? 'Reviews' : 'Ulasan'}
                    </span>
                    {comments.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold">
                        {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsCommentsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                {/* Scrollable comments content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <ProjectComments
                    slug={project.slug}
                    comments={comments}
                    setComments={setComments}
                    allowComments={project.allowComments}
                    sectionId={commentsSectionId}
                    withDivider={false}
                    isVisible={true}
                    animated={false}
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Tabbed Content (Header, Tabs Navigation, Tab Panels) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black" data-no-window-drag>
          {/* Header & Meta (Fixed Top of Right Column) */}
          <div className="p-5 sm:p-6 border-b border-black/5 dark:border-white/5 flex-shrink-0">
            <ProjectHeader project={project} translations={translations} isWindowMode={true} />
          </div>

          {/* Tabs Navigation Bar (Mac/iOS-style segment control) */}
          <div className="px-5 sm:px-6 py-3 border-b border-black/5 dark:border-white/5 bg-gray-50/30 dark:bg-gray-900/5 flex-shrink-0">
            <div className="relative flex bg-gray-100/80 dark:bg-gray-900/60 p-1 rounded-xl gap-1">
              {/* Persistent animated pill — prevents animation jump bug */}
              <motion.div
                className="absolute inset-y-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm z-0"
                layoutId={`activeWindowTabPill-${project.id}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{
                  left: `calc(${(windowTabs.findIndex(t => t.id === activeWindowTab) / windowTabs.length) * 100}% + 4px)`,
                  width: `calc(${100 / windowTabs.length}% - ${windowTabs.length > 1 ? '4px' : '8px'})`,
                }}
              />
              {windowTabs.map((tab) => {
                const isActive = activeWindowTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveWindowTab(tab.id)}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 outline-none ${
                      isActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-center">
                      <Icon size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive 
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Panel (Independent Internal Scrolling) */}
          <div className="flex-grow flex-1 h-0 overflow-y-auto p-5 sm:p-6">
            <AnimatePresence mode="wait">
              {activeWindowTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="space-y-6"
                >
                  {projectBadges}
                  <ProjectMeta project={project} translations={translations} isWindowMode={true} />
                  
                  <div className="border-t border-black/5 dark:border-white/5 pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">
                      {translations ? 'About Project' : 'Tentang Proyek'}
                    </h4>
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {translations?.description || project.description}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeWindowTab === 'story' && (
                <motion.div
                  key="story"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="story-tab-container -mt-8"
                >
                  <ProjectNarrative
                    project={project}
                    translations={translations}
                    activeTab={activeNarrativeTab}
                    onTabChange={setActiveNarrativeTab}
                  />
                </motion.div>
              )}

              {activeWindowTab === 'gallery' && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="space-y-4"
                >
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-2">
                    {translations ? 'Project Gallery' : 'Galeri Proyek'}
                  </h4>
                  <ProjectGallery project={project} gallery={gallery} onGroupClick={setActiveGalleryGroup} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

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

                {!isWindowMode &&
                  renderEngagementPanel(
                    'mt-6 space-y-6 px-6 pb-10 sm:mt-8 sm:space-y-8 lg:px-10'
                  )}
              </div>

              {/* Details Section */}
              <div className="flex w-full flex-col lg:w-[55%]">
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Header */}
                  {!isWindowMode && (
                    <ProjectHeader
                      project={project}
                      translations={translations}
                      isWindowMode={isWindowMode}
                    />
                  )}

                  {/* Meta Info */}
                  {!isWindowMode && (
                    <ProjectMeta
                      project={project}
                      translations={translations}
                      isWindowMode={isWindowMode}
                    />
                  )}

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
