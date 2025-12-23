"use client"
import Link from 'next/link'
import type { Project } from '@/types/projects'


export default function DetailMeta({ p }: { p: Project }) {

  return (
    <div className="flex flex-wrap gap-4 lg:gap-6 items-center">
      {p.client && (
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium">{p.client}</span>
        </div>
      )}
      {p.year && (
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">{p.year}</span>
        </div>
      )}
      {p.tags && (
        <div className="flex flex-wrap gap-2">
          {p.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      )}
      {p.external_link && (
        <div className="flex items-center gap-2">
          <Link
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
            href={p.external_link}
            target="_blank"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Link
          </Link>
        </div>
      )}
    </div>
  )
}

