'use client';

import React from 'react';
import type { Project, GalleryItem, GalleryGroup } from '@/types/projects';
import type { Comment } from '@/lib/magic';
import { ProjectHeader, ProjectMediaColumn } from './index';
import ProjectDetailTabsPane, {
  type ProjectWindowTab,
  type ProjectWindowTabId,
} from './ProjectDetailTabsPane';

interface ProjectWindowSplitViewProps {
  project: Project;
  displayProject: Project;
  cover: GalleryItem;
  gallery: GalleryItem[];
  ratio: number;
  isMobile: boolean;
  isLeftColumnHovered: boolean;
  setIsLeftColumnHovered: React.Dispatch<React.SetStateAction<boolean>>;
  isCommentsOpen: boolean;
  setIsCommentsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isEnglish: boolean;
  isProjectLiked: boolean;
  metrics: { likes: number; shares: number };
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  translations: Record<string, string> | null;
  translateLoading: boolean;
  isLikePending: boolean;
  handleProjectLike: () => void;
  handleProjectShare: () => void;
  translateAll: () => void;
  handleScrollToComments: () => void;
  commentsSectionId: string;
  windowTabs: ProjectWindowTab[];
  activeWindowTab: ProjectWindowTabId;
  setActiveWindowTab: (tab: ProjectWindowTabId) => void;
  projectBadges: React.ReactNode;
  activeNarrativeTab: 'challenge' | 'solution' | 'impact';
  setActiveNarrativeTab: (tab: 'challenge' | 'solution' | 'impact') => void;
  setActiveGalleryGroup: (group: GalleryGroup) => void;
}

export function ProjectWindowSplitView({
  project,
  displayProject,
  cover,
  gallery,
  ratio,
  isMobile,
  isLeftColumnHovered,
  setIsLeftColumnHovered,
  isCommentsOpen,
  setIsCommentsOpen,
  isEnglish,
  isProjectLiked,
  metrics,
  comments,
  setComments,
  translations,
  translateLoading,
  isLikePending,
  handleProjectLike,
  handleProjectShare,
  translateAll,
  handleScrollToComments,
  commentsSectionId,
  windowTabs,
  activeWindowTab,
  setActiveWindowTab,
  projectBadges,
  activeNarrativeTab,
  setActiveNarrativeTab,
  setActiveGalleryGroup,
}: ProjectWindowSplitViewProps) {
  return (
    <div className="flex h-full w-full select-text flex-col overflow-y-auto bg-white transition-colors duration-300 dark:bg-black md:flex-row md:overflow-hidden">
      {/* Left Column: Media & Core Interaction */}
      <ProjectMediaColumn
        project={project}
        displayProject={displayProject}
        cover={cover}
        ratio={ratio}
        isWindowMode={true}
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
        className="relative flex min-h-[260px] w-full shrink-0 items-center justify-center overflow-hidden border-b border-black/10 bg-gray-50/50 touch-pan-y dark:border-white/10 dark:bg-gray-900/10 md:h-full md:w-[42%] md:border-b-0 md:border-r cursor-pointer md:cursor-default"
      />

      {/* Right Column: Tabbed Content (Header, Tabs Navigation, Tab Panels) */}
      <div
        className="flex min-h-0 w-full flex-1 flex-col overflow-visible bg-white dark:bg-black md:h-full md:overflow-hidden"
        data-no-window-drag
      >
        <div className="flex-shrink-0 border-b border-black/5 p-5 dark:border-white/5 sm:p-6">
          <ProjectHeader
            project={displayProject}
            translations={translations}
            isWindowMode={true}
          />
        </div>

        <ProjectDetailTabsPane
          project={displayProject}
          gallery={gallery}
          translations={translations}
          isEnglish={isEnglish}
          isWindowMode={true}
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
  );
}
