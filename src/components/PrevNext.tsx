"use client"
import Link from 'next/link';
import type { Project } from '@/types/projects';

export default function PrevNext({ list, current }: { list: Project[]; current: Project }) {
  const idx = list.findIndex(p => p.slug === current.slug);
  const prev = idx > 0 ? list[idx - 1] : undefined;
  const next = idx < list.length - 1 ? list[idx + 1] : undefined;

  return (
    <div className="flex items-center justify-between pt-8 border-t border-gray-200">
      <div className="flex-1">
        {prev && (
          <Link
            className="group flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            href={`/work/${prev.slug}`}
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Previous</span>
              <span className="text-sm font-medium">{prev.title}</span>
            </span>
          </Link>
        )}
      </div>

      <div className="flex-1 flex justify-end">
        {next && (
          <Link
            className="group flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            href={`/work/${next.slug}`}
          >
            <span className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide text-right">Next</span>
              <span className="text-sm font-medium">{next.title}</span>
            </span>
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
