'use client'

import type { Project } from '@/types/projects'
import { useMemo, useState, useEffect, useRef } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest'
import ProjectCardList from '@/components/projects/ProjectCardList'
import ProjectSplitView from '@/components/projects/ProjectSplitView'
import MasonryGrid from '@/components/layout/MasonryGrid'
import dynamic from 'next/dynamic'

const InfiniteCanvas3D = dynamic(() => import('@/components/projects/InfiniteCanvas3D'), { ssr: false })

type Props = {
  projects: Project[]
  tag: string
  searchQuery: string
  windowWidth?: number
  isLoading?: boolean // Prop baru dari parent
  view?: 'grid' | 'list' | 'canvas'
}

// Minimal typing for Fuse.js since it's dynamically imported
interface FuseResult<T> {
  item: T
  refIndex: number
  score?: number
}

interface FuseInstance<T> {
  search: (query: string) => FuseResult<T>[]
  setCollection: (collection: T[]) => void
}

export default function IndexClientInner({
  projects,
  tag,
  searchQuery,
  windowWidth,
  isLoading: isParentLoading,
  view = 'grid'
}: Props) {
  // Start with a smaller number to improve initial load performance (LCP)
  const [visibleCount, setVisibleCount] = useState(6)

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fuseInstance, setFuseInstance] = useState<FuseInstance<Project> | null>(null)

  // BUG FIX #3: Cleanup flag untuk mencegah setState pada unmounted component
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // BUG FIX #3 & #7: Lazy load Fuse.js dengan proper cleanup dan auto-update collection
  useEffect(() => {
    // Only load Fuse if user actually types to save bundle size
    if (searchQuery) {
      // Small timeout to not block typing immediately
      const timeoutId = setTimeout(() => {
        import('fuse.js').then((FuseModule) => {
          // Guard: jangan update state kalau component sudah unmount
          if (!isMountedRef.current) return

          const Fuse = FuseModule.default || FuseModule

          setFuseInstance(prevInstance => {
            if (!prevInstance) {
              return new Fuse(projects, {
                keys: ['title', 'description', 'client', 'tags'],
                threshold: 0.3,
                includeScore: true,
              }) as unknown as FuseInstance<Project>
            } else {
              prevInstance.setCollection(projects)
              return prevInstance
            }
          })
        }).catch(err => {
          console.error('[IndexClientInner] Failed to load Fuse.js:', err)
        })
      }, 100);

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, projects])

  // BUG FIX #7: Update Fuse collection saat projects berubah (tanpa re-create instance)
  useEffect(() => {
    if (fuseInstance && searchQuery) {
      fuseInstance.setCollection(projects)
    }
  }, [projects, fuseInstance, searchQuery])

  // Filter projects by tag and search
  const filteredProjects = useMemo(() => {
    let result = projects

    // Filter by tag or type
    if (tag) {
      const lowerTag = tag.toLowerCase();
      result = result.filter((p) =>
        (p.tags || []).some((t) => t.toLowerCase() === lowerTag) ||
        (p.type && p.type.toLowerCase() === lowerTag)
      )
    }

    // Then filter by search query (only if fuse is loaded)
    if (searchQuery && fuseInstance) {
      const searchResults = fuseInstance.search(searchQuery)
      const searchedProjectIds = new Set(searchResults.map((r) => r.item.id))

      // If tag filter is active, intersect the results using IDs
      if (tag) {
        result = result.filter(p => searchedProjectIds.has(p.id))
      } else {
        result = searchResults.map((r) => {
          const freshProject = projects.find(p => p.id === r.item.id)
          return freshProject || r.item
        }).filter(Boolean) as Project[]
      }
    }

    return result
  }, [projects, tag, searchQuery, fuseInstance])

  // SAFETY LIMIT FOR INFINITE SCROLL
  // User requested "No Limit" behavior (looping forever).
  // However, technically arrays cannot be infinite.
  // We set a Safe Limit of 1,000 items.
  // - This allows scrolling for a very long time (repeating projects ~20-50 times).
  // - It prevents the browser from crashing due to too many DOM elements.
  // - Combined with Lazy Loading in Media.tsx, this is bandwidth-safe.
  const MAX_DISPLAY_COUNT = 1000;

  const displayedProjects = useMemo(() => {
    if (!filteredProjects.length) return [];

    // INFINITE LOOP LOGIC:
    // We create a virtual array of length 'visibleCount'.
    // We use the modulo operator (%) to wrap around the project list.
    // Example: If we have 10 projects, item #11 will be project #1.
    return Array.from({ length: visibleCount }).map((_, i) => {
      return filteredProjects[i % filteredProjects.length];
    });
  }, [filteredProjects, visibleCount]);

  // RESET HANDLER:
  // When the user types a search or changes a tag, we must reset the scroll
  // back to the top (14 items) so they don't get lost.
  // BUG FIX #8: Initialize dengan IDs yang valid untuk mencegah flash
  const prevProjectIds = useRef<string>(projects.map(p => p.id).join(','));

  useEffect(() => {
    const currentIds = filteredProjects.map(p => p.id).join(',');
    if (currentIds !== prevProjectIds.current) {
      setVisibleCount(6);
      prevProjectIds.current = currentIds;
    }
  }, [filteredProjects])

  // OPTIMIZED SCROLL OBSERVER:
  // This watches the bottom of the page. When the user reaches it:
  // 1. It checks if we haven't hit the MAX_DISPLAY_COUNT (1000).
  // 2. It loads 14 more items.
  // 3. It uses 'rootMargin' to preload content before the user actually hits the bottom.
  const observerTarget = useRef<HTMLDivElement>(null)

  // Use refs for values that change frequently to avoid recreating observer
  const scrollStateRef = useRef({ isLoadingMore, visibleCount, filteredCount: filteredProjects.length })
  useEffect(() => {
    scrollStateRef.current = { isLoadingMore, visibleCount, filteredCount: filteredProjects.length }
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const { isLoadingMore: loading, visibleCount: count, filteredCount } = scrollStateRef.current;
        if (entries[0].isIntersecting && !loading && filteredCount > 0 && count < MAX_DISPLAY_COUNT) {
          setIsLoadingMore(true)

          // Load next batch with a slight delay to prevent re-render loops
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 14, MAX_DISPLAY_COUNT))
            setIsLoadingMore(false)
          }, 500)
        }
      },
      {
        rootMargin: '800px 0px', // Load more when user is 800px away from bottom
        threshold: 0.1
      }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, []) // Observer created once — reads current state via ref

  // Combine loading states
  const showLoading = isLoadingMore || isParentLoading;

  return (
    <section className="pt-4 pb-8 px-4" data-projects-grid>
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">Portfolio - Creative Works & Projects</h1>

      {/* Tag Filter Indicator */}
      {tag && (
        <div className="mb-6 text-center">
          <span className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm">
            Filtered by tag: <strong>{tag}</strong>
          </span>
        </div>
      )}

      {/* Projects Grid */}
      <LazyMotion features={domAnimation}>
        <div className={view === 'grid' ? 'min-h-screen' : ''}>
          {displayedProjects.length > 0 ? (
            <>
              {view === 'grid' ? (
                <MasonryGrid width={windowWidth}>
                  {displayedProjects.map((project, index) => {
                    // Determine priority based on index (first 2 items get priority for faster LCP)
                    const isPriority = index < 2;

                    // Animation Logic:
                    // Priority items (first 2): No animation at all - instant display for LCP
                    // Non-priority items: Fade in only (no Y movement to prevent CLS)
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
                        // BUG FIX: Remove contentVisibility yang menyebabkan flickering
                        // GPU acceleration only for smooth animations
                        style={{
                          willChange: 'transform',
                        }}
                      >
                        <ProjectCardPinterest
                          project={project}
                          priority={isPriority}
                          videoEnabled={true}
                          highlightedTag={tag}
                        />
                      </m.div>
                    )
                  })}
                </MasonryGrid>
              ) : view === 'list' ? (
                <ProjectSplitView 
                  projects={filteredProjects}
                  tag={tag}
                />
              ) : view === 'canvas' ? (
                <div className="fixed inset-0 z-[40] bg-[#f4f4f5] animate-in fade-in duration-500">
                  <InfiniteCanvas3D projects={displayedProjects} />
                </div>
              ) : null}

              {/* Infinite Scroll Sentinel - Only for grid */}
              {view === 'grid' && (
                <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />
              )}

              {/* Loading indicator - Only for grid */}
              {view === 'grid' && showLoading && (
                <div className="text-center py-8 opacity-50">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                  <p className="text-xs mt-2 text-gray-500">Loading more projects...</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600 text-lg mb-2">
                {searchQuery
                  ? `No projects found for "${searchQuery}"`
                  : tag
                    ? `No projects with tag "${tag}"`
                    : 'No projects available'}
              </p>
              {searchQuery && (
                <p className="text-gray-500 mt-2 text-sm">
                  Coba kata kunci lain atau bersihkan kotak pencarian di atas.
                </p>
              )}
            </div>
          )}
        </div>
      </LazyMotion>
    </section>
  )
}
