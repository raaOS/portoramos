'use client'

import type { Project } from '@/types/projects'
import { useMemo, useEffect, useRef, memo, useDeferredValue, useState } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react'
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest'
import ProjectSplitView from '@/components/projects/ProjectSplitView'
import MasonryGrid from '@/components/layout/MasonryGrid'
import dynamic from 'next/dynamic'
import { useProjectFiltering } from './hooks/useProjectFiltering'
import { useInfiniteScroll } from './hooks/useInfiniteScroll'
import { useQuickLook } from '@/hooks/useQuickLook'
import QuickLookModal from '@/components/ui/QuickLookModal'
import { resolveCover } from '@/lib/images'

const Projects3DView = dynamic(() => import('@/components/canvas/Projects3DView'), { ssr: false })

type Props = {
  projects: Project[]
  tag: string
  searchQuery: string
  windowWidth?: number
  isLoading?: boolean
  view?: 'grid' | 'list' | '3d'
}

const MemoizedProjectCardPinterest = memo(ProjectCardPinterest)
const MemoizedProjectSplitView = memo(ProjectSplitView)

function ViewLoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <div className="aspect-[4/5] bg-gray-200 dark:bg-neutral-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-2/3" />
        <div className="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>
    </div>
  )
}

// Pre-computed skeleton array — avoids re-creating on every render
const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => <SkeletonCard key={`skel-${i}`} />);

export default function IndexClientInner({
  projects, tag, searchQuery, windowWidth, isLoading: isParentLoading, view = 'grid'
}: Props) {
  const { filteredProjects } = useProjectFiltering(projects, tag, searchQuery);
  const { visibleCount, isLoadingMore, hasMore, resetCount, initialCount } = useInfiniteScroll(filteredProjects.length);
  const activeView = useDeferredValue(view);
  const isViewTransitioning = activeView !== view;

  // Quick Look
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [quickLookProject, setQuickLookProject] = useState<Project | null>(null);

  useQuickLook(!!hoveredProjectId && !quickLookProject, () => {
    const proj = filteredProjects.find(p => p.id === hoveredProjectId);
    if (proj) setQuickLookProject(proj);
  });

  // Reset scroll count when filter changes
  const prevFilterHash = useRef('');
  useEffect(() => {
    const hash = `${tag}-${searchQuery}-${filteredProjects.length}`;
    if (hash !== prevFilterHash.current) {
      resetCount();
      prevFilterHash.current = hash;
    }
  }, [tag, searchQuery, filteredProjects.length, resetCount]);

  // Build looping display list via modulo — 20 projects repeat seamlessly
  const displayedItems = useMemo(() => {
    const len = filteredProjects.length;
    if (len === 0) return [];
    const items: { project: Project; key: string }[] = new Array(visibleCount);
    for (let i = 0; i < visibleCount; i++) {
      const project = filteredProjects[i % len];
      // Key format: slug-loopN-posN (unique per rendered instance)
      items[i] = { project, key: `${project.slug}-L${(i / len) | 0}-${i % len}` };
    }
    return items;
  }, [filteredProjects, visibleCount]);

  const gridPriorityCount = Math.min(initialCount, displayedItems.length);

  const gridView = useMemo(() => (
    <MasonryGrid width={windowWidth}>
      {displayedItems.map((item, index) => {
        const isPriority = index < gridPriorityCount;
        const animationProps = isPriority ? undefined : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-30px" },
          transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as any
        };
        return (
          <m.div
            key={item.key}
            {...animationProps}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '300px', contain: 'layout paint style', transform: 'translateZ(0)' }}
            onMouseEnter={() => setHoveredProjectId(item.project.id)}
            onMouseLeave={() => setHoveredProjectId(null)}
          >
            <MemoizedProjectCardPinterest project={item.project} priority={isPriority} videoEnabled={true} highlightedTag={tag} />
          </m.div>
        )
      })}
    </MasonryGrid>
  ), [displayedItems, windowWidth, tag, gridPriorityCount]);

  const showLoading = isParentLoading || isViewTransitioning;

  return (
    <section className={`${activeView === '3d' ? '' : 'pt-4 px-4'} pb-8`} data-projects-grid>
      <h1 className="sr-only">Portfolio - Creative Works & Projects</h1>
      {tag && (
        <div className="mb-6 text-center">
          <span className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm">Filtered by tag: <strong>{tag}</strong></span>
        </div>
      )}
      <LazyMotion features={domAnimation}>
        <div className={activeView === '3d' ? 'fixed inset-0 z-0 overflow-hidden' : 'min-h-screen'}>
          {showLoading ? <ViewLoadingIndicator /> : displayedItems.length > 0 ? (
            <>
              {activeView === '3d'
                ? <Projects3DView projects={filteredProjects} />
                : activeView === 'grid'
                  ? gridView
                  : <MemoizedProjectSplitView projects={filteredProjects} tag={tag} />
              }
              {activeView === 'grid' && (
                <>
                  {/* Sentinel spacer for scroll detection */}
                  {hasMore && (
                    <div className="h-10 w-full pointer-events-none" aria-hidden="true" />
                  )}

                  {/* Loading skeletons */}
                  <AnimatePresence>
                    {isLoadingMore && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 mt-2 md:mt-4"
                      >
                        {SKELETON_ITEMS}
                      </m.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </>
          ) : (
            <div className="p-12 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600 text-lg mb-2">
                {searchQuery ? `No projects found for "${searchQuery}"` : tag ? `No projects with tag "${tag}"` : 'No projects available'}
              </p>
            </div>
          )}
        </div>
      </LazyMotion>

      {/* Quick Look Modal */}
      {quickLookProject && (() => {
        const cover = resolveCover(quickLookProject);
        return (
          <QuickLookModal
            isOpen={!!quickLookProject}
            onClose={() => setQuickLookProject(null)}
            title={quickLookProject.title}
            type={cover.kind}
            url={cover.src}
            metadata={quickLookProject.tags?.join(', ')}
            onGoToDetail={() => window.location.href = `/projects/${quickLookProject.slug}`}
          />
        );
      })()}
    </section>
  )
}
