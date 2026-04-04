'use client'

import type { Project } from '@/types/projects'
import { useMemo, useState, useEffect, useRef, memo } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest'
import ProjectSplitView from '@/components/projects/ProjectSplitView'
import MasonryGrid from '@/components/layout/MasonryGrid'
import dynamic from 'next/dynamic'
import { useProjectFiltering } from './hooks/useProjectFiltering'
import { useInfiniteScroll } from './hooks/useInfiniteScroll'

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

export default function IndexClientInner({
  projects, tag, searchQuery, windowWidth, isLoading: isParentLoading, view = 'grid'
}: Props) {
  const { filteredProjects } = useProjectFiltering(projects, tag, searchQuery);
  const { visibleCount, isLoadingMore, observerTarget, resetCount } = useInfiniteScroll(filteredProjects.length);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const prevViewRef = useRef(view);

  useEffect(() => {
    if (prevViewRef.current !== view) {
      setIsViewTransitioning(true);
      const timer = setTimeout(() => { setIsViewTransitioning(false); prevViewRef.current = view; }, 150);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // RESET HANDLER: Reset scroll count when filter or tag changes
  const prevFilterHash = useRef('');
  useEffect(() => {
    const hash = `${tag}-${searchQuery}-${filteredProjects.length}`;
    if (hash !== prevFilterHash.current) {
      resetCount(6);
      prevFilterHash.current = hash;
    }
  }, [tag, searchQuery, filteredProjects.length, resetCount]);

  const displayedProjects = useMemo(() => {
    if (!filteredProjects.length) return [];
    return Array.from({ length: visibleCount }).map((_, i) => filteredProjects[i % filteredProjects.length]);
  }, [filteredProjects, visibleCount]);

  const gridView = useMemo(() => (
    <MasonryGrid width={windowWidth}>
      {displayedProjects.map((project, index) => {
        const isPriority = index < 2;
        const animationProps = isPriority ? {} : {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true, margin: "-50px" },
          transition: { duration: 0.5 }
        };
        return (
          <m.div
            key={`${project.slug}-${index}`}
            {...animationProps}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '300px', contain: 'layout paint style', transform: 'translateZ(0)' }}
          >
            <MemoizedProjectCardPinterest project={project} priority={isPriority} videoEnabled={true} highlightedTag={tag} />
          </m.div>
        )
      })}
    </MasonryGrid>
  ), [displayedProjects, windowWidth, tag]);

  const showLoading = isParentLoading || isViewTransitioning;

  return (
    <section className={`${view === '3d' ? '' : 'pt-4 px-4'} pb-8`} data-projects-grid>
      <h1 className="sr-only">Portfolio - Creative Works & Projects</h1>
      {tag && (
        <div className="mb-6 text-center">
          <span className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm">Filtered by tag: <strong>{tag}</strong></span>
        </div>
      )}
      <LazyMotion features={domAnimation}>
        <div className={view === '3d' ? 'fixed inset-0 z-0 overflow-hidden' : 'min-h-screen'}>
          {showLoading ? <ViewLoadingIndicator /> : displayedProjects.length > 0 ? (
            <>
              {view === '3d' ? <Projects3DView projects={filteredProjects} /> : view === 'grid' ? gridView : <MemoizedProjectSplitView projects={filteredProjects} tag={tag} />}
              {view === 'grid' && (
                <>
                  <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />
                  {(isLoadingMore || isParentLoading) && (
                    <div className="text-center py-8 opacity-50">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      <p className="text-xs mt-2 text-gray-500">Loading more projects...</p>
                    </div>
                  )}
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
    </section>
  )
}
