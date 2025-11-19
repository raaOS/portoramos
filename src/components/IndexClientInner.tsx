'use client'

import Card from '@/components/Card'
import type { Project } from '@/types'
import { useMemo } from 'react'

type Props = {
  projects: Project[]
  tag: string
  lastUpdated?: Date | null
}

export default function IndexClientInner({ projects, tag, lastUpdated }: Props) {
  const filteredProjects = useMemo(() => {
    if (!tag) return projects
    return projects.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()))
  }, [projects, tag])

  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold">Indeks</h1>
          {lastUpdated && (
            <div className="mt-2 text-xs text-gray-700">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {filteredProjects.length} proyek{tag ? ` • tag: ${tag}` : ''}
        </p>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="masonry">
          {filteredProjects.map((p) => (
            <div key={p.slug}>
              <Card p={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 border rounded-lg text-sm text-gray-600 text-center">
          {tag ? `Tidak ada proyek dengan tag "${tag}"` : 'Tidak ada proyek tersedia'}
        </div>
      )}
    </section>
  )
}
