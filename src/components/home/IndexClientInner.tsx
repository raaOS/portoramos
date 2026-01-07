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
  // Responsive Initial Count: Start with 12 to fill larger screens immediately
  const [visibleCount, setVisibleCount] = useState(12)

  // Set correct count on mount/resize based on screen width
  useEffect(() => {
    const updateCount = () => {
      // Mobile: 6 is fine for LCP, but 12 ensures smooth scrolling
      // Desktop: 12 ensures full viewport coverage
      setVisibleCount(window.innerWidth > 768 ? 12 : 8)
    }
    updateCount()

    // Optional: Update on resize? No, usually not needed for initial load optimization.
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [fuseInstance, setFuseInstance] = useState<FuseInstance<Project> | null>(null)
  const rafRef = useRef<number | null>(null)

  // Lazy load Fuse.js and update collection when projects change
  useEffect(() => {
    if (searchQuery) {
      import('fuse.js').then((FuseModule) => {
        const Fuse = FuseModule.default || FuseModule

        if (!fuseInstance) {
          // Initialize new instance
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFuseInstance(new Fuse(projects, {
            keys: ['title', 'description', 'client', 'tags'],
            threshold: 0.3,
            includeScore: true,
          }) as any as FuseInstance<Project>)
        } else {
          // Update collection if instance exists and projects changed
          fuseInstance.setCollection(projects)
        }
      })
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
        // If no tag, return search results mapped from current projects to ensure freshness
        // (Visual order usually comes from search score, so we should map strictly from search results but ensure latest data)
        // However, standard fuse usage usually just returns the item. 
        // To be safe against stale item references in Fuse:
        result = searchResults.map((r) => {
          const freshProject = projects.find(p => p.id === r.item.id)
          return freshProject || r.item
        }).filter(Boolean) as Project[]
      }
    }

    return result
  }, [projects, tag, searchQuery, fuseInstance])

  // SAFE INFINITE LOOP:
  // We use modulo logic to repeat projects effectively indefinitely but cap it at a safe limit
  // to prevent browser crash. e.g. 5 loops or 150 items max.
  const MAX_DISPLAY_COUNT = 150;

  const displayedProjects = useMemo(() => {
    if (!filteredProjects.length) return [];

    // Create an array of length 'visibleCount'
    // Map each index to a project from filteredProjects using modulo
    return Array.from({ length: visibleCount }).map((_, i) => {
      return filteredProjects[i % filteredProjects.length];
    });
  }, [filteredProjects, visibleCount]);

  // Reset visible count when filters change - use smaller mobile count for faster LCP
  useEffect(() => {
    setVisibleCount(window.innerWidth > 768 ? 6 : 6)
  }, [filteredProjects])

  // Optimized infinite scroll with IntersectionObserver
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && filteredProjects.length > 0 && visibleCount < MAX_DISPLAY_COUNT) {
          setIsLoading(true)

          // Append in batches of 24 for better performance during fast scrolling
          setVisibleCount(prev => Math.min(prev + 24, MAX_DISPLAY_COUNT))

          // Small delay to prevent double-triggering before state propagates
          setTimeout(() => {
            setIsLoading(false)
          }, 50)
        }
      },
      {
        rootMargin: '1200px 0px', // Pre-fetch content early
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
      <div className="min-h-[80vh]">
        {displayedProjects.length > 0 ? (
          <>
            <MasonryGrid>
              {displayedProjects.map((project, index) => {
                return (
                  <motion.div
                    key={`${project.slug}-${index}`}
                    initial={index < 12 ? { opacity: 1, y: 30 } : { opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: index < 12 ? 0.2 : 0.5, // Faster fade for initial batch
                      ease: "easeOut",
                      // INSTANT LOAD FIX: No delay for first 12 items
                      delay: index < 12 ? 0 : (Math.floor(index / 7) % 5) * 0.1
                    }}
                  >
                    <ProjectCardPinterest
                      project={project}
                      priority={index < 4} // Mobile LCP: Only first 4 need priority
                      videoEnabled={true} // Enable video for all positions (handled by lazy load)
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
