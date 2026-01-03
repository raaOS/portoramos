import type { Project } from '@/types/projects'
import { allProjectsAsync } from '@/lib/projects'
import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo'
import WorksClient from './WorksClient'

type Props = { searchParams?: { page?: string } }

const PAGE_SIZE = 12

// Set revalidate to 0 for real-time updates (SSR)
export const revalidate = 0;

export const metadata: Metadata = generateSEOMetadata({
  title: 'Works',
  description: 'Kumpulan project pilihan Ramos – mulai dari desain UI/UX, branding, hingga explorasi visual dengan fokus pada detail dan konsistensi.',
  path: '/works'
});

export default async function WorksPage({ searchParams }: Props) {
  const projects = await allProjectsAsync()
  const page = Number(searchParams?.page || '1')
  const currentPage = isNaN(page) || page < 1 ? 1 : page

  return (
    <div className="container">
      <WorksClient projects={projects} currentPage={currentPage} />
    </div>
  );
}
