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
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(projects || [])
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

  // Optimize Initial Load: Only render top 4 items first, then the rest
  const [hasDeferredLoaded, setHasDeferredLoaded] = useState(false);

  // Initialize displayed projects
  // If we haven't deferred loaded yet, ONLY show top 4.
  // Unless there is a search filter active, then show all (UX priority).
  useEffect(() => {
    if (filteredProjects.length > 0) {
      if (!hasDeferredLoaded && !tag && !searchQuery) {
        setDisplayedProjects(filteredProjects.slice(0, 4));
        // Defer the rest by a small tick to allow painting
        setTimeout(() => {
          setHasDeferredLoaded(true);
          setDisplayedProjects(filteredProjects);
        }, 100);
      } else {
        setDisplayedProjects(filteredProjects);
      }
    }
  }, [filteredProjects, tag, searchQuery, hasDeferredLoaded])

  // Optimized infinite scroll with requestAnimationFrame
  useEffect(() => {
    let ticking = false

    const checkScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY
      const bottomPosition = document.documentElement.scrollHeight
      const distanceFromBottom = bottomPosition - scrollPosition

      // Trigger at 1000px for good UX
      if (distanceFromBottom < 1000 && !isLoading && filteredProjects.length > 0) {
        setIsLoading(true)

        requestAnimationFrame(() => {
          setDisplayedProjects(prev => [...prev, ...filteredProjects])

          setTimeout(() => {
            setIsLoading(false)
          }, 300)
        })
      }

      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        rafRef.current = requestAnimationFrame(checkScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [filteredProjects, isLoading])

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
                // AGGRESSIVE OPTIMIZATION:
                // Top 4 items (Above the fold) are rendered STATICALLY without Framer Motion.
                // This removes JS execution overhead during the critical LCP window.
                const isLcpItem = index < 4;

                if (isLcpItem) {
                  return (
                    <div key={`${project.slug}-${index}`} className="mb-6">
                      <ProjectCardPinterest
                        project={project}
                        priority={true} // Always priority for LCP items
                        videoEnabled={index !== 0} // LCP Optimization: Disable video for first item
                      />
                    </div>
                  )
                }

                return (
                  <motion.div
                    key={`${project.slug}-${index}`}
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 0 // Remove staggered delay for faster perceived load of lower items
                    }}
                  >
                    <ProjectCardPinterest
                      project={project}
                      priority={false}
                    />
                  </motion.div>
                )
              })}
            </MasonryGrid>

            {/* Subtle loading indicator */}
            {isLoading && (
              <div className="text-center py-8 opacity-50">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
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
