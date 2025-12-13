'use client'

import type { Project } from '@/types/projects'
import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import MasonryGrid from '@/components/MasonryGrid'
import ProjectCardPinterest from '@/components/ProjectCardPinterest'
import SearchBar from '@/components/SearchBar'

type Props = {
  projects: Project[]
  tag: string
  lastUpdated?: Date | null
}

export default function IndexClientInner({ projects, tag, lastUpdated }: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    // Handle Fuse.js import compatibility (some environments need .default, others direct)
    const FuseConstructor = (Fuse as any).default || Fuse;
    return new FuseConstructor(projects, {
      keys: ['title', 'description', 'client', 'tags'],
      threshold: 0.3,
      includeScore: true,
    }) as Fuse<Project>
  }, [projects])

  // Filter projects by tag and search
  const filteredProjects = useMemo(() => {
    let result = projects

    // Filter by tag first
    if (tag) {
      result = result.filter((p) =>
        (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())
      )
    }

    // Then filter by search query
    if (searchQuery) {
      const searchResults = fuse.search(searchQuery)
      const searchedProjects = searchResults.map(r => r.item)

      // If tag filter is active, intersect the results
      if (tag) {
        result = result.filter(p => searchedProjects.includes(p))
      } else {
        result = searchedProjects
      }
    }

    return result
  }, [projects, tag, searchQuery, fuse])

  return (
    <section className="py-8">
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
      {filteredProjects.length > 0 ? (
        <MasonryGrid>
          {filteredProjects.map((project, index) => (
            <div key={project.slug}>
              <ProjectCardPinterest
                project={project}
                priority={index < 6} // Prioritize first 6 images
              />
            </div>
          ))}
        </MasonryGrid>
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
    </section>
  )
}
