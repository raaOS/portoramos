import type { Metadata } from 'next'
import { Suspense } from 'react'
import IndexClientWithAutoUpdate from '@/components/home/IndexClientWithAutoUpdate'
import { allProjectsAsync } from '@/lib/projects'
import SystemNavFrame from '@/components/layout/SystemNavFrame'
import ProjectsFinderHeader from './_components/ProjectsFinderHeader'

// Disable caching for Projects page to ensure immediate dock/content updates
export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Projects | Ramos Portfolio',
    description: 'Daftar lengkap project desain dan pengembangan oleh Ramos.',
}

export default async function ProjectsPage() {
    const projects = await allProjectsAsync();

    // allProjectsAsync() already filters drafts

    return (
        <SystemNavFrame>
            <main id="main-content" role="main" className="flex-1 bg-white">
                {/* Integrated Finder Header - Wrapped in Suspense for useSearchParams */}
                <Suspense fallback={
                    <div className="px-4 sm:px-8 py-4 mt-8 h-16 bg-gray-50 animate-pulse rounded" />
                }>
                    <ProjectsFinderHeader itemCount={projects.length} />
                </Suspense>

                <Suspense fallback={
                    <section className="py-24 px-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Memuat koleksi project...</p>
                    </section>
                }>
                    <IndexClientWithAutoUpdate initialProjects={projects} />
                </Suspense>
            </main>
        </SystemNavFrame>
    );
}
