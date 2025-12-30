import type { Metadata } from 'next'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'
import { resolveCover } from '@/lib/images'

type Props = {
  searchParams?: { tag?: string }
}

// Cache server-rendered home page (ISR 60s for performance)
export const revalidate = 60

export const metadata: Metadata = {
  title: baseSEO.title,
  description: 'Portofolio kreatif Ramos berisi project desain digital, UI/UX, dan visual yang berfokus pada storytelling, detail, dan pengalaman pengguna yang halus.',
}

export default async function Home({ searchParams }: Props) {
  // Load projects server-side to avoid hydration issues
  const projects = await allProjectsAsync()
  const filteredProjects = (projects || [])
    .filter(p => p.status !== 'draft');

  return (
    <main id="main-content" role="main">
      <IndexClientWithAutoUpdate initialProjects={filteredProjects} searchParams={searchParams} />
    </main>
  );
}
