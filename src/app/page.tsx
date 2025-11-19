import IndexClientWithAutoUpdate from '@/components/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'

type Props = {
  searchParams?: { tag?: string }
}

// Cache server-rendered home page untuk mengurangi beban server
export const revalidate = 3600

export default async function Home({ searchParams }: Props) {
  // Load projects server-side to avoid hydration issues
  const projects = await allProjectsAsync()
  
  return (
    <main id="main-content" role="main">
      <IndexClientWithAutoUpdate initialProjects={projects} searchParams={searchParams} />
    </main>
  );
}
