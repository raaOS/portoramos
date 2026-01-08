'use client'

import type { Project } from '@/types/projects'
import { useMemo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ProjectCardPinterest from '@/components/projects/ProjectCardPinterest'
import SearchBar from '@/components/SearchBar'
import MasonryGrid from '@/components/MasonryGrid'

type Props = {
  projects: Project[]
  tag: string
  lastUpdated?: Date | string | null
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

export default function IndexClientInner({ projects, tag, lastUpdated }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  // Start with a reasonable number that fills the screen but isn't too heavy.
  // 14 items allows for full screen coverage immediately
  const [visibleCount, setVisibleCount] = useState(14)

  const [isLoading, setIsLoading] = useState(false)
  const [fuseInstance, setFuseInstance] = useState<FuseInstance<Project> | null>(null)

  // Lazy load Fuse.js and update collection when projects change
  useEffect(() => {
    // Only load Fuse if user actually types to save bundle size
    if (searchQuery) {
      // Small timeout to not block typing immediately
      const id = setTimeout(() => {
        import('fuse.js').then((FuseModule) => {
          const Fuse = FuseModule.default || FuseModule

          if (!fuseInstance) {
            setFuseInstance(new Fuse(projects, {
              keys: ['title', 'description', 'client', 'tags'],
              threshold: 0.3,
              includeScore: true,
            }) as any as FuseInstance<Project>)
          } else {
            fuseInstance.setCollection(projects)
          }
        })
      }, 100);
      return () => clearTimeout(id)
    }
  }, [searchQuery, projects, fuseInstance])

  // Filter projects by tag and search
  const filteredProjects = useMemo(() => {
    let result = projects

    // Filter by tag first
    if (tag) {
      result = result.filter((p) =>
        (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())
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
  useEffect(() => {
    setVisibleCount(14)
  }, [filteredProjects.length, searchQuery, tag])

  // OPTIMIZED SCROLL OBSERVER:
  // This watches the bottom of the page. When the user reaches it:
  // 1. It checks if we haven't hit the MAX_DISPLAY_COUNT (1000).
  // 2. It loads 14 more items.
  // 3. It uses 'rootMargin' to preload content before the user actually hits the bottom.
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && filteredProjects.length > 0 && visibleCount < MAX_DISPLAY_COUNT) {
          setIsLoading(true)

          // Load next batch
          setVisibleCount(prev => Math.min(prev + 14, MAX_DISPLAY_COUNT))

          // Use Animation Frame to ensure the UI updates smoothly without stutter
          requestAnimationFrame(() => {
            setIsLoading(false)
          })
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
  }, [filteredProjects.length, isLoading, visibleCount])

  return (
    <section className="py-8 px-4">
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">Portfolio - Creative Works & Projects</h1>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search projects by title, client, or tags..."
        resultsCount={searchQuery ? filteredProjects.length : undefined}
      />

      {/* Tag Filter Indicator */}
      {tag && (
        <div className="mb-6 text-center">
          <span className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm">
            Filtered by tag: <strong>{tag}</strong>
          </span>
        </div>
      )}

      {/* Projects Grid */}
      <div className="min-h-screen">
        {displayedProjects.length > 0 ? (
          <>
            <MasonryGrid>
              {displayedProjects.map((project, index) => {
                // Determine priority based on index (first 14 items get priority)
                const isPriority = index < 14;

                // Animation Logic:
                // First 14 items: NO ANIMATION STATE CHANGE to prevent blink.
                // Next items: Animate only when scrolled into view
                const animationProps = isPriority
                  ? {
                    animate: { opacity: 1, y: 0 },
                    initial: { opacity: 1, y: 0 }, // MATCH FINAL STATE = NO BLINK
                    transition: { duration: 0 }    // INSTANT
                  }
                  : {
                    initial: { opacity: 0, y: 60 }, // Slightly more dramatic for scroll
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "50px" },
                    transition: { duration: 0.6, ease: "easeOut" }
                  };

                return (
                  <motion.div
                    key={`${project.slug}-${index}`}
                    {...animationProps}
                  >
                    <ProjectCardPinterest
                      project={project}
                      priority={isPriority}
                      videoEnabled={true}
                      highlightedTag={tag}
                    />
                  </motion.div>
                )
              })}
            </MasonryGrid>

            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} className="h-10 w-full pointer-events-none" aria-hidden="true" />

            {/* Subtle loading indicator */}
            {isLoading && (
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
              <button
                onClick={() => setSearchQuery('')}
                className="text-black underline hover:no-underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
