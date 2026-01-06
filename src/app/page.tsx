import type { Metadata } from 'next'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'
import { resolveCover } from '@/lib/images'

// Cache server-rendered home page (ISR: Revalidate every 60 seconds)
export const revalidate = 60

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
      <IndexClientWithAutoUpdate initialProjects={filteredProjects} />
    </main>
  );
}
