'use client';

import type { Project } from '@/types/projects';
import {
  useMemo,
  useEffect,
  useRef,
  memo,
  useDeferredValue,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { LazyMotion, domAnimation, m, AnimatePresence, type Transition } from 'motion/react';
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest';
import MasonryGrid from '@/components/layout/MasonryGrid';
import { useProjectFiltering } from './hooks/useProjectFiltering';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useQuickLook } from '@/components/os/hooks/useQuickLook';
import QuickLookModal from '@/components/ui/QuickLookModal';
import { resolveCover } from '@/lib/images';
import { useDictionary } from '@/contexts/LanguageContext';
import OSWindow from '@/components/os/windows/Window';
import ProjectDetailWrapper from '@/components/os/ui/ProjectDetailWrapper';

import Projects3DView from '@/components/canvas/Projects3DView';

type Props = {
  projects: Project[];
  tag: string;
  searchQuery: string;
  windowWidth?: number;
  isLoading?: boolean;
  view?: 'grid' | '3d';
};

const MemoizedProjectCardPinterest = memo(ProjectCardPinterest);

function ViewLoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-400"></div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800">
      <div className="aspect-[4/5] bg-gray-200 dark:bg-neutral-700" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-700" />
        <div className="h-2.5 w-1/2 rounded bg-gray-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}

// Pre-computed skeleton array — avoids re-creating on every render
const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => <SkeletonCard key={`skel-${i}`} />);

export default function IndexClientInner({
  projects,
  tag,
  searchQuery,
  windowWidth,
  isLoading: isParentLoading,
  view = 'grid',
}: Props) {
  const t = useDictionary();
  const { filteredProjects } = useProjectFiltering(projects, tag, searchQuery);
  const { visibleCount, isLoadingMore, hasMore, resetCount, initialCount } = useInfiniteScroll(
    filteredProjects.length
  );
  const activeView = useDeferredValue(view);
  const isViewTransitioning = activeView !== view;

  // Quick Look
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [quickLookProject, setQuickLookProject] = useState<Project | null>(null);

  useQuickLook(!!hoveredProjectId && !quickLookProject, () => {
    const proj = filteredProjects.find((p) => p.id === hoveredProjectId);
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
  const gridEagerCount = Math.min(Math.max(initialCount, 20), displayedItems.length);

  // Project Detail Window Modal state (SSR-safe mount detection)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedOriginRect, setSelectedOriginRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | undefined>(undefined);
  const [windowPosition, setWindowPosition] = useState<{ x: number; y: number } | null>(null);

  const handleSelectProject = useCallback(
    (project: Project, e?: React.MouseEvent<HTMLElement>) => {
      if (e?.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        setSelectedOriginRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setSelectedOriginRect(undefined);
      }

      const modalWidth = Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 32 : 960);
      const modalHeight = Math.min(640, typeof window !== 'undefined' ? window.innerHeight - 64 : 640);
      const initialX = Math.max(16, (typeof window !== 'undefined' ? window.innerWidth - modalWidth : 0) / 2);
      const initialY = Math.max(32, (typeof window !== 'undefined' ? window.innerHeight - modalHeight : 0) / 2);

      setWindowPosition({ x: initialX, y: initialY });
      setSelectedProject(project);
    },
    []
  );

  const handleCloseProjectWindow = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedProject) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseProjectWindow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, handleCloseProjectWindow]);

  // Lock body & html scroll when project modal or quick look is open
  useEffect(() => {
    const isModalOpen = !!selectedProject || !!quickLookProject;
    if (!isModalOpen || typeof document === 'undefined') return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [selectedProject, quickLookProject]);

  const gridView = useMemo(
    () => (
      <MasonryGrid width={windowWidth}>
        {displayedItems.map((item, index) => {
          const isPriority = index < gridPriorityCount;
          const isEager = index < gridEagerCount;
          const animationProps = isPriority
            ? undefined
            : {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-30px' },
                transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
              };
          return (
            <m.div
              key={item.key}
              {...animationProps}
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '300px',
                contain: 'layout paint style',
                transform: 'translateZ(0)',
              }}
              onMouseEnter={() => setHoveredProjectId(item.project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              <MemoizedProjectCardPinterest
                project={item.project}
                priority={isPriority}
                eager={isEager}
                videoEnabled={true}
                highlightedTag={tag}
                transitionOrigin="grid"
                onClick={(e) => handleSelectProject(item.project, e)}
              />
            </m.div>
          );
        })}
      </MasonryGrid>
    ),
    [displayedItems, windowWidth, tag, gridPriorityCount, gridEagerCount, handleSelectProject]
  );

  const showLoading = isParentLoading || isViewTransitioning;

  return (
    <section className={`${activeView === '3d' ? '' : 'px-4 pb-8 pt-4'}`} data-projects-grid>
      <h1 className="sr-only">{t.projects.srTitle}</h1>
      {tag && (
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-black px-4 py-2 text-sm text-white">
            {t.projects.filteredByTag}: <strong>{tag}</strong>
          </span>
        </div>
      )}
      <LazyMotion features={domAnimation}>
        <div className={activeView === '3d' ? 'fixed inset-0 z-0 overflow-hidden' : 'min-h-screen'}>
          {showLoading ? (
            <ViewLoadingIndicator />
          ) : displayedItems.length > 0 ? (
            <>
              {activeView === '3d' ? <Projects3DView projects={filteredProjects} /> : gridView}
              {activeView === 'grid' && (
                <>
                  {/* Sentinel spacer for scroll detection */}
                  {hasMore && (
                    <div className="pointer-events-none h-10 w-full" aria-hidden="true" />
                  )}

                  {/* Loading skeletons */}
                  <AnimatePresence>
                    {isLoadingMore && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:mt-4 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
                      >
                        {SKELETON_ITEMS}
                      </m.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="mb-2 text-lg text-gray-600">
                {searchQuery
                  ? `${t.projects.noProjectsForSearch} "${searchQuery}"`
                  : tag
                    ? `${t.projects.noProjectsWithTag} "${tag}"`
                    : t.projects.noProjectsAvailable}
              </p>
            </div>
          )}
        </div>
      </LazyMotion>

      {/* Quick Look Modal (Portaled to document.body to bypass contain:paint) */}
      {mounted &&
        quickLookProject &&
        createPortal(
          (() => {
            const cover = resolveCover(quickLookProject);
            return (
              <QuickLookModal
                isOpen={!!quickLookProject}
                onClose={() => setQuickLookProject(null)}
                title={quickLookProject.title}
                type={cover.kind}
                url={cover.src}
                metadata={quickLookProject.tags?.join(', ')}
                onGoToDetail={() => {
                  const proj = quickLookProject;
                  setQuickLookProject(null);
                  handleSelectProject(proj);
                }}
              />
            );
          })(),
          document.body
        )}

      {/* Project Detail Window Modal (Portaled to document.body to bypass contain:paint) */}
      {mounted &&
        selectedProject &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseProjectWindow();
              }
            }}
            onWheel={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <OSWindow
              id={`project-${selectedProject.id}`}
              title={`Portfolio: ${selectedProject.title}`}
              isOpen={true}
              onClose={handleCloseProjectWindow}
              width={Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 32 : 960)}
              height={Math.min(640, typeof window !== 'undefined' ? window.innerHeight - 64 : 640)}
              noPadding={true}
              zIndex={60}
              isFocused={true}
              originRect={selectedOriginRect}
              initialPosition={
                windowPosition || {
                  x: Math.max(16, (typeof window !== 'undefined' ? window.innerWidth - 960 : 0) / 2),
                  y: Math.max(32, (typeof window !== 'undefined' ? window.innerHeight - 640 : 0) / 2),
                }
              }
              onUpdatePosition={(x, y) => setWindowPosition({ x, y })}
            >
              <ProjectDetailWrapper
                project={selectedProject}
                projects={projects}
              />
            </OSWindow>
          </div>,
          document.body
        )}
    </section>
  );
}
