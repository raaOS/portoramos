import type { Metadata } from 'next'
import { Suspense } from 'react'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import { loadAboutData } from '@/lib/about'

// Disable caching for Projects page to ensure immediate dock/content updates
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'Projects | Ramos Portfolio',
    description: 'Daftar lengkap project desain dan pengembangan oleh Ramos.',
}

export default async function ProjectsPage() {
    const [projects, aboutData] = await Promise.all([
        allProjectsAsync(),
        loadAboutData()
    ]);

    const filteredProjects = (projects || [])
        .filter(p => p.status !== 'draft');

    return (
        <main id="main-content" role="main">
            <Suspense fallback={
                <section className="py-8 px-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-sm text-gray-500">Memuat koleksi project...</p>
                </section>
            }>
                <IndexClientWithAutoUpdate initialProjects={filteredProjects} />
            </Suspense>
        </main>
    );
}
