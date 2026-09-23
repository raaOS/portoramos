'use client';

import React from 'react';
import type { Project, GalleryItem } from '@/types/projects';
import type { Comment } from '@/lib/magic';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import { ProjectCover } from './ProjectCover';
import { ProjectInteractionBar } from './ProjectInteractionBar';
import { ProjectComments } from './ProjectComments';

interface ProjectMediaColumnProps {
  project: Project;
  displayProject: Project;
  cover: GalleryItem;
  ratio: number;
  isWindowMode: boolean;
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
  className?: string;
  keyPrefix?: string;
}

export function ProjectMediaColumn({
  project,
  displayProject,
  cover,
  ratio,
  isWindowMode,
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
  className,
  keyPrefix = '',
}: ProjectMediaColumnProps) {
  return (
    <div
      onMouseEnter={() => setIsLeftColumnHovered(true)}
      onMouseLeave={() => {
        setIsLeftColumnHovered(false);
        setIsCommentsOpen(false);
      }}
      onClick={() => {
        if (isMobile) setIsLeftColumnHovered((prev) => !prev);
      }}
      className={
        className ||
        'relative flex w-full items-center justify-center overflow-hidden border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-gray-900/20 lg:w-[45%] lg:border-b-0 lg:border-r cursor-pointer lg:cursor-default'
      }
      data-no-window-drag
    >
      <div
        className="relative w-full transition-[padding] duration-300 ease-out"
        style={{
          paddingRight: isMobile || isLeftColumnHovered || !isWindowMode ? '44px' : '12px',
          paddingLeft: '12px',
        }}
      >
        <ProjectCover
          project={displayProject}
          cover={cover}
          ratio={ratio}
          isWindowMode={true}
          enableViewTransition={!isWindowMode}
        />

        <motion.div
          key={`interaction-bar-${keyPrefix}${project.id}`}
          className="pointer-events-none absolute inset-y-0 right-1.5 z-20 flex items-center sm:right-2.5"
          initial={{ x: 60, opacity: 0 }}
          animate={{
            x: isMobile || isLeftColumnHovered || !isWindowMode ? 0 : 60,
            opacity: isMobile || isLeftColumnHovered || !isWindowMode ? 1 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 22,
            delay: isMobile ? 0.35 : 0,
          }}
        >
          <ProjectInteractionBar
            isProjectLiked={isProjectLiked}
            metrics={metrics}
            comments={comments}
            translations={translations}
            translateLoading={translateLoading}
            likePending={isLikePending}
            onLike={handleProjectLike}
            onShare={handleProjectShare}
            onTranslate={translateAll}
            onScrollToComments={handleScrollToComments}
            orientation="vertical"
            projectSlug={project.slug}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="absolute inset-0 z-30 flex flex-col bg-white/95 backdrop-blur-xl dark:bg-black/95"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {isEnglish ? 'Reviews' : 'Ulasan'}
                </span>
                {comments.length > 0 && (
                  <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
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
  );
}
