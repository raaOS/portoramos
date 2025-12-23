'use client'

import Card from '@/components/shared/Card'
import AnimateItem from '@/components/AnimateItem'
import Link from 'next/link'

import MainNav from '@/components/MainNav'
import type { Project } from '@/types/projects'
import { useMemo } from 'react'

type Props = {
  projects: Project[]
  currentPage: number
}

const PAGE_SIZE = 12

export default function WorksClient({ projects, currentPage }: Props) {
  const total = projects.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(currentPage, totalPages)
  const start = (current - 1) * PAGE_SIZE
  const items = useMemo(() => projects.slice(start, start + PAGE_SIZE), [projects, start])


  const q = (p: number) => p > 1 ? `?page=${p}` : ''

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white">All Works</h1>
        <p className="text-sm text-gray-600 dark:text-white">{total} projects • Page {current} / {totalPages}</p>
      </div>

      {total > 0 ? (
        <div className="masonry">
          {items.map((p, i) => (
            <div key={p.slug}>
              <AnimateItem i={i}><Card p={p} animate={false} /></AnimateItem>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 border rounded-lg text-sm text-gray-600 text-center">
          No projects found.
        </div>
      )}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200 dark:border-white">
        <div>
          {current > 1 ? (
            <Link className="text-sm underline text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300" href={q(current - 1)}>← Previous</Link>
          ) : <span />}
        </div>
        <div className="text-sm text-gray-600 dark:text-white">
          Page {current} / {totalPages}
        </div>
        <div>
          {current < totalPages ? (
            <Link className="text-sm underline text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300" href={q(current + 1)}>Next →</Link>
          ) : <span />}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center">
        <MainNav />
      </div>
    </section>
  )
}
