import type { Metadata } from 'next'
import { Suspense } from 'react'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'
import { resolveCover } from '@/lib/images'

// Cache server-rendered home page (ISR: Revalidate every 1 hour)
export const revalidate = 3600

export const metadata: Metadata = {
  title: baseSEO.title,
  description: 'Portofolio kreatif Ramos berisi project desain digital, UI/UX, dan visual yang berfokus pada storytelling, detail, dan pengalaman pengguna yang halus.',
}

export default async function Home() {
  // Load projects server-side to avoid hydration issues
  // Note: allProjectsAsync() might fetch fresh data, but since this page is Cached via ISR,
  // it only runs once every 60s on the server. Users get instant HTML.
  const projects = await allProjectsAsync()
  const filteredProjects = (projects || [])
    .filter(p => p.status !== 'draft');

  return (
    <main id="main-content" role="main">
      <Suspense fallback={
        <section className="py-8 px-4">
          {/* Skeleton Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="h-12 bg-gray-100 rounded-full animate-pulse" />
          </div>
          {/* Skeleton Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-gray-200 rounded-md animate-pulse" style={{ aspectRatio: '4/5' }} />
                <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      }>
        <IndexClientWithAutoUpdate initialProjects={filteredProjects} />
      </Suspense>
    </main>
  );
}
