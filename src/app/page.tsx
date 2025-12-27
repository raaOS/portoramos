import type { Metadata } from 'next'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { baseSEO } from '@/lib/seo'
import { resolveCover } from '@/lib/images'

type Props = {
  searchParams?: { tag?: string }
}

// Cache server-rendered home page
export const revalidate = 0

export const metadata: Metadata = {
  title: baseSEO.title,
  description: baseSEO.description,
}

export default async function Home({ searchParams }: Props) {
  // Load projects server-side to avoid hydration issues
  const projects = await allProjectsAsync()
  const filteredProjects = (projects || [])
    .filter(p => p.status !== 'draft');

  // LCP Optimization: Preload the first project's cover image (or video poster)
  // This allows the browser to start downloading the LCP image immediately, in parallel with hydration.
  let preloadLink = null;
  if (filteredProjects.length > 0) {
    const firstProject = filteredProjects[0];
    const { src, poster, kind } = resolveCover(firstProject);
    const preloadUrl = kind === 'video' ? poster : src;

    if (preloadUrl) {
      preloadLink = (
        <link
          rel="preload"
          as="image"
          href={preloadUrl}
          // @ts-ignore - fetchPriority is valid in React 18+ / Next.js but types might lag
          fetchPriority="high"
        />
      );
    }
  }

  return (
    <main id="main-content" role="main">
      {preloadLink}
      <IndexClientWithAutoUpdate initialProjects={filteredProjects} searchParams={searchParams} />
    </main>
  );
}
